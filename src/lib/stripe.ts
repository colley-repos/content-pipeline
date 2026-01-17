import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined')
  }
  
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }
  
  return stripeInstance
}

export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeClient = getStripe()
    const value = stripeClient[prop as keyof Stripe]
    if (typeof value === 'function') {
      return value.bind(stripeClient)
    }
    return value
  }
})

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: 'Monthly Plan',
    price: 29,
    interval: 'month' as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    name: 'Yearly Plan',
    price: 290,
    interval: 'year' as const,
  },
}

export async function createCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      createdAt: new Date().toISOString(),
    },
  })
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: {
      userId,
    },
  })
}

export async function createPortalSession(customerId: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  })
}

export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId)
}
