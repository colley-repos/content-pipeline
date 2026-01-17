import OpenAI from 'openai'

let openaiInstance: OpenAI | null = null
let azureOpenAIInstance: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  // Check Azure first
  if (process.env.AZURE_OPENAI_API_KEY) {
    if (!azureOpenAIInstance) {
      azureOpenAIInstance = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
        defaultQuery: { 'api-version': '2024-02-01' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
      })
    }
    return azureOpenAIInstance
  }
  
  // Fallback to regular OpenAI
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is missing')
  }
  
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  
  return openaiInstance
}

const client = new Proxy({} as OpenAI, {
  get: (target, prop) => {
    const openaiClient = getOpenAIClient()
    const value = openaiClient[prop as keyof OpenAI]
    if (typeof value === 'function') {
      return value.bind(openaiClient)
    }
    return value
  }
})

export interface GenerateContentParams {
  type: 'social_post' | 'caption' | 'script' | 'bio' | 'reply' | 'content_calendar'
  prompt: string
  context?: string
  tone?: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational'
  length?: 'short' | 'medium' | 'long'
}

export interface GenerateContentResult {
  content: string
  // Note: Using open source models, not tracking tokens
  // GPU compute time will be tracked separately when video generation is integrated
}

const SYSTEM_PROMPTS = {
  social_post: `You are an expert social media content creator. Generate engaging, viral-worthy social media posts that capture attention, drive engagement, and encourage shares. Include relevant emojis and hashtags naturally.`,
  
  caption: `You are a professional caption writer. Create compelling, concise captions that complement visual content and drive engagement. Use strategic hashtags and calls-to-action.`,
  
  script: `You are a professional video script writer. Create engaging, well-structured scripts with clear hooks, valuable content, and strong calls-to-action. Format with scene descriptions and dialogue.`,
  
  bio: `You are a personal branding expert. Create compelling, memorable bios that showcase personality, expertise, and value proposition in a concise format.`,
  
  reply: `You are a social media engagement specialist. Create thoughtful, engaging replies that add value to conversations and build community. Match the tone of the original message.`,
  
  content_calendar: `You are a content strategy expert. Create comprehensive content calendars with diverse post ideas, optimal posting times, and strategic themes.`,
}

const TONE_MODIFIERS = {
  professional: 'Maintain a professional, authoritative tone suitable for business contexts.',
  casual: 'Use a friendly, conversational tone that feels authentic and relatable.',
  humorous: 'Incorporate wit and humor while staying tasteful and on-brand.',
  inspirational: 'Use uplifting, motivational language that inspires action and positivity.',
  educational: 'Focus on providing valuable information in an accessible, engaging way.',
}

const LENGTH_GUIDELINES = {
  short: 'Keep it brief and punchy (1-2 sentences or 50-100 words).',
  medium: 'Provide moderate detail (3-5 sentences or 100-200 words).',
  long: 'Offer comprehensive content (200+ words with multiple paragraphs).',
}

export async function generateContent(params: GenerateContentParams): Promise<GenerateContentResult> {
  const { type, prompt, context, tone = 'casual', length = 'medium' } = params

  const systemPrompt = SYSTEM_PROMPTS[type]
  const toneModifier = TONE_MODIFIERS[tone]
  const lengthGuideline = LENGTH_GUIDELINES[length]

  const fullPrompt = `${prompt}

${context ? `Context: ${context}\n` : ''}
Tone: ${toneModifier}
Length: ${lengthGuideline}

Generate high-quality content that stands out and drives engagement.`

  try {
    // TODO: Replace with open source model API
    // For now, using OpenAI as placeholder (will be replaced with open source alternatives)
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullPrompt },
      ],
      temperature: 0.8,
      max_tokens: type === 'content_calendar' ? 2000 : 1000,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content generated')
    }

    // Add viral CTA if configured
    const viralCTA = process.env.VIRAL_CTA
    const finalContent = viralCTA && type !== 'content_calendar' 
      ? `${content}\n\n${viralCTA}` 
      : content

    return {
      content: finalContent,
      // Not tracking tokens since we'll use open source models
    }
  } catch (error) {
    console.error('Content generation error:', error)
    throw new Error('Failed to generate content')
  }
}

export async function generateBulkContent(
  prompts: GenerateContentParams[]
): Promise<GenerateContentResult[]> {
  const results = await Promise.all(prompts.map((params) => generateContent(params)))
  return results
}
