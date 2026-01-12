const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEFAULT_PRESETS = [
  {
    name: 'Energetic',
    description: 'Fast-paced with quick cuts and upbeat vibes',
    vibeCategory: 'energetic',
    creatorTypes: ['food', 'travel', 'fitness', 'automotive', 'music'],
    jumpCutFrequency: 10,
    transitionStyle: 'cut',
    musicTempo: 'upbeat',
    soundEffects: ['whoosh', 'pop', 'swoosh'],
    colorFilter: 'vibrant',
    textStyle: { font: 'bold', animation: 'bounce' },
  },
  {
    name: 'Chill Vibes',
    description: 'Relaxed and smooth with gentle transitions',
    vibeCategory: 'chill',
    creatorTypes: ['lifestyle', 'art', 'photography', 'travel'],
    jumpCutFrequency: 2,
    transitionStyle: 'fade',
    musicTempo: 'slow',
    soundEffects: ['ambient', 'soft'],
    colorFilter: 'warm',
    textStyle: { font: 'serif', animation: 'fade' },
  },
  {
    name: 'Professional',
    description: 'Clean, polished, and business-focused',
    vibeCategory: 'professional',
    creatorTypes: ['education', 'fashion', 'photography'],
    jumpCutFrequency: 3,
    transitionStyle: 'fade',
    musicTempo: 'medium',
    soundEffects: [],
    colorFilter: 'neutral',
    textStyle: { font: 'sans-serif', animation: 'slide' },
  },
  {
    name: 'Funny',
    description: 'Comedic timing with playful effects',
    vibeCategory: 'funny',
    creatorTypes: ['gaming', 'food', 'cosplay'],
    jumpCutFrequency: 12,
    transitionStyle: 'zoom',
    musicTempo: 'upbeat',
    soundEffects: ['boing', 'cartoon', 'laugh', 'ding'],
    colorFilter: 'saturated',
    textStyle: { font: 'bold', animation: 'bounce' },
  },
  {
    name: 'Dramatic',
    description: 'Bold effects and emotional storytelling',
    vibeCategory: 'dramatic',
    creatorTypes: ['fashion', 'music', 'cosplay', 'travel'],
    jumpCutFrequency: 4,
    transitionStyle: 'slide',
    musicTempo: 'slow',
    soundEffects: ['cinematic', 'impact', 'tension'],
    colorFilter: 'cinematic',
    textStyle: { font: 'serif', animation: 'fade' },
  },
]

async function main() {
  console.log('Seeding editing presets...')

  for (const preset of DEFAULT_PRESETS) {
    await prisma.editingPreset.upsert({
      where: { name: preset.name },
      update: preset,
      create: preset,
    })
    console.log(`✓ Created preset: ${preset.name}`)
  }

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
