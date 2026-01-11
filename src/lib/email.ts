import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ${process.env.APP_NAME}!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We're excited to have you on board! You're now part of a community creating amazing content with AI.</p>
            
            <p><strong>Here's what you can do:</strong></p>
            <ul>
              <li>✨ Generate unlimited social media posts</li>
              <li>📝 Create engaging captions and scripts</li>
              <li>🎯 Build content calendars</li>
              <li>💬 Craft perfect replies</li>
              <li>🚀 Share your creations with viral CTAs</li>
            </ul>
            
            <a href="${process.env.APP_URL}/dashboard" class="button">Start Creating Content</a>
            
            <p>If you have any questions, just reply to this email. We're here to help!</p>
            
            <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return await sendEmail({
    to: email,
    subject: `Welcome to ${process.env.APP_NAME}! 🎉`,
    html,
  })
}

export async function sendSubscriptionConfirmation(email: string, name: string, plan: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .plan-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎊 Subscription Activated!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Great news! Your subscription is now active.</p>
            
            <div class="plan-box">
              <h3>✅ ${plan}</h3>
              <p>You now have unlimited access to all premium features!</p>
            </div>
            
            <p><strong>What's unlocked:</strong></p>
            <ul>
              <li>🚀 Unlimited content generation</li>
              <li>📊 Advanced analytics</li>
              <li>🎨 Premium templates</li>
              <li>⚡ Priority support</li>
              <li>📅 Automated content calendars</li>
            </ul>
            
            <a href="${process.env.APP_URL}/dashboard" class="button">Go to Dashboard</a>
            
            <p>Start creating amazing content right now!</p>
            
            <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
            <p><a href="${process.env.APP_URL}/dashboard">Manage Subscription</a></p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return await sendEmail({
    to: email,
    subject: `🎉 Your ${plan} is Active!`,
    html,
  })
}

export async function sendWeeklyContentPack(email: string, name: string, contentIdeas: string[]) {
  const ideasHtml = contentIdeas.map(idea => `<li>${idea}</li>`).join('')
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ideas-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .ideas-box ul { padding-left: 20px; }
          .ideas-box li { margin: 10px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Your Weekly Content Pack</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Here are your fresh content ideas for this week!</p>
            
            <div class="ideas-box">
              <h3>💡 This Week's Ideas:</h3>
              <ul>${ideasHtml}</ul>
            </div>
            
            <a href="${process.env.APP_URL}/dashboard" class="button">Create Content Now</a>
            
            <p>Turn these ideas into engaging posts with just one click!</p>
            
            <p>Best regards,<br>The ${process.env.APP_NAME} Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return await sendEmail({
    to: email,
    subject: `📅 Your Weekly Content Ideas from ${process.env.APP_NAME}`,
    html,
  })
}
