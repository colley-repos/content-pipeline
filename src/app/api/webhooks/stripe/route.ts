import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionConfirmation } from '@/lib/email'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Maximum age for webhook events (5 minutes in milliseconds)
const MAX_EVENT_AGE_MS = 5 * 60 * 1000

/**
 * Check if webhook event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: eventId },
  })
  return existing?.processed === true
}

/**
 * Mark webhook event as processed
 */
async function markEventProcessed(
  eventId: string,
  eventType: string,
  eventTimestamp: Date,
  metadata?: any
): Promise<void> {
  await prisma.webhookEvent.upsert({
    where: { stripeEventId: eventId },
    update: {
      processed: true,
      processedAt: new Date(),
      metadata,
    },
    create: {
      stripeEventId: eventId,
      type: eventType,
      processed: true,
      processedAt: new Date(),
      eventTimestamp,
      metadata,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Check event timestamp to prevent replay attacks
    const eventTime = new Date(event.created * 1000)
    const now = new Date()
    const eventAge = now.getTime() - eventTime.getTime()

    if (eventAge > MAX_EVENT_AGE_MS) {
      console.warn(`Rejecting old webhook event: ${event.id}, age: ${eventAge}ms`)
      return NextResponse.json(
        { error: 'Event too old' },
        { status: 400 }
      )
    }

    // Check if event has already been processed (idempotency)
    if (await isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, alreadyProcessed: true })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          await prisma.subscription.update({
            where: { userId },
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0].price.id,
              status: 'ACTIVE',
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })

          // Send confirmation email
          const user = await prisma.user.findUnique({
            where: { id: userId },
          })

          if (user?.email && user?.name) {
            const planName = subscription.items.data[0].price.recurring?.interval === 'year'
              ? 'Yearly Plan'
              : 'Monthly Plan'
            
            await sendSubscriptionConfirmation(user.email, user.name, planName)
          }

          // Log analytics
          await prisma.analytics.create({
            data: {
              userId,
              event: 'SUBSCRIPTION_STARTED',
              metadata: {
                subscriptionId: subscription.id,
                priceId: subscription.items.data[0].price.id,
              },
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: subscription.status.toUpperCase() as any,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          })

          await prisma.analytics.create({
            data: {
              userId: dbSubscription.userId,
              event: 'SUBSCRIPTION_UPDATED',
              metadata: {
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'CANCELED',
            },
          })

          await prisma.analytics.create({
            data: {
              userId: dbSubscription.userId,
              event: 'SUBSCRIPTION_CANCELED',
              metadata: {
                subscriptionId: subscription.id,
              },
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        })

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: 'PAST_DUE',
            },
          })

          await prisma.analytics.create({
            data: {
              userId: dbSubscription.userId,
              event: 'PAYMENT_FAILED',
              metadata: {
                invoiceId: invoice.id,
              },
            },
          })
        }
        break
      }
    }

    // Mark event as processed
    await markEventProcessed(
      event.id,
      event.type,
      eventTime,
      { processed: true }
    )

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    
    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
