// Seed script for sound assets
// Run with: node prisma/seed-sounds.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const soundAssets = [
  // Music - Energetic
  { name: 'Upbeat Energy', category: 'music', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/upbeat-energy.mp3', duration: 120, bpm: 140, tags: ['pop', 'electronic', 'motivational'], isRoyaltyFree: true },
  { name: 'Fast Lane', category: 'music', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/fast-lane.mp3', duration: 150, bpm: 150, tags: ['rock', 'driving', 'intense'], isRoyaltyFree: true },
  { name: 'Electric Dreams', category: 'music', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/electric-dreams.mp3', duration: 180, bpm: 128, tags: ['electronic', 'synth', 'modern'], isRoyaltyFree: true },
  { name: 'Power Up', category: 'music', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/power-up.mp3', duration: 90, bpm: 135, tags: ['gaming', 'electronic', 'energetic'], isRoyaltyFree: true },
  { name: 'Hype Train', category: 'music', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/hype-train.mp3', duration: 110, bpm: 145, tags: ['hip-hop', 'trap', 'modern'], isRoyaltyFree: true },

  // Music - Chill
  { name: 'Morning Breeze', category: 'music', vibe: ['chill'], fileUrl: 'https://example.com/sounds/morning-breeze.mp3', duration: 180, bpm: 85, tags: ['acoustic', 'peaceful', 'relaxing'], isRoyaltyFree: true },
  { name: 'Sunset Vibes', category: 'music', vibe: ['chill'], fileUrl: 'https://example.com/sounds/sunset-vibes.mp3', duration: 200, bpm: 70, tags: ['lofi', 'ambient', 'smooth'], isRoyaltyFree: true },
  { name: 'Coffee Shop', category: 'music', vibe: ['chill'], fileUrl: 'https://example.com/sounds/coffee-shop.mp3', duration: 240, bpm: 75, tags: ['jazz', 'caf├®', 'relaxing'], isRoyaltyFree: true },
  { name: 'Ocean Waves', category: 'music', vibe: ['chill'], fileUrl: 'https://example.com/sounds/ocean-waves.mp3', duration: 160, bpm: 60, tags: ['ambient', 'nature', 'peaceful'], isRoyaltyFree: true },
  { name: 'Lazy Sunday', category: 'music', vibe: ['chill'], fileUrl: 'https://example.com/sounds/lazy-sunday.mp3', duration: 190, bpm: 80, tags: ['indie', 'folk', 'mellow'], isRoyaltyFree: true },

  // Music - Professional
  { name: 'Corporate Success', category: 'music', vibe: ['professional'], fileUrl: 'https://example.com/sounds/corporate-success.mp3', duration: 120, bpm: 110, tags: ['corporate', 'motivational', 'uplifting'], isRoyaltyFree: true },
  { name: 'Innovation', category: 'music', vibe: ['professional'], fileUrl: 'https://example.com/sounds/innovation.mp3', duration: 140, bpm: 115, tags: ['tech', 'modern', 'forward'], isRoyaltyFree: true },
  { name: 'Executive Suite', category: 'music', vibe: ['professional'], fileUrl: 'https://example.com/sounds/executive-suite.mp3', duration: 160, bpm: 105, tags: ['business', 'elegant', 'sophisticated'], isRoyaltyFree: true },

  // Music - Funny
  { name: 'Quirky Comedy', category: 'music', vibe: ['funny'], fileUrl: 'https://example.com/sounds/quirky-comedy.mp3', duration: 90, bpm: 120, tags: ['comedy', 'playful', 'fun'], isRoyaltyFree: true },
  { name: 'Silly Shenanigans', category: 'music', vibe: ['funny'], fileUrl: 'https://example.com/sounds/silly-shenanigans.mp3', duration: 100, bpm: 130, tags: ['cartoon', 'funny', 'lighthearted'], isRoyaltyFree: true },
  { name: 'Goofy Groove', category: 'music', vibe: ['funny'], fileUrl: 'https://example.com/sounds/goofy-groove.mp3', duration: 80, bpm: 125, tags: ['comedy', 'upbeat', 'silly'], isRoyaltyFree: true },

  // Music - Dramatic
  { name: 'Epic Journey', category: 'music', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/epic-journey.mp3', duration: 200, bpm: 90, tags: ['cinematic', 'orchestral', 'epic'], isRoyaltyFree: true },
  { name: 'Rising Tension', category: 'music', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/rising-tension.mp3', duration: 150, bpm: 100, tags: ['suspense', 'dramatic', 'intense'], isRoyaltyFree: true },
  { name: 'Hero\'s Theme', category: 'music', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/hero-theme.mp3', duration: 180, bpm: 95, tags: ['epic', 'heroic', 'powerful'], isRoyaltyFree: true },

  // Sound Effects - Energetic
  { name: 'Whoosh', category: 'sound_effect', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/whoosh.mp3', duration: 1, bpm: null, tags: ['transition', 'fast', 'motion'], isRoyaltyFree: true },
  { name: 'Pop', category: 'sound_effect', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/pop.mp3', duration: 0.5, bpm: null, tags: ['impact', 'quick', 'punchy'], isRoyaltyFree: true },
  { name: 'Swoosh', category: 'sound_effect', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/swoosh.mp3', duration: 0.8, bpm: null, tags: ['transition', 'movement', 'fast'], isRoyaltyFree: true },
  { name: 'Zap', category: 'sound_effect', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/zap.mp3', duration: 0.6, bpm: null, tags: ['electric', 'energy', 'power'], isRoyaltyFree: true },
  { name: 'Pow', category: 'sound_effect', vibe: ['energetic'], fileUrl: 'https://example.com/sounds/pow.mp3', duration: 0.7, bpm: null, tags: ['impact', 'punch', 'hit'], isRoyaltyFree: true },

  // Sound Effects - Chill
  { name: 'Ambient Pad', category: 'sound_effect', vibe: ['chill'], fileUrl: 'https://example.com/sounds/ambient-pad.mp3', duration: 5, bpm: null, tags: ['background', 'atmospheric', 'soft'], isRoyaltyFree: true },
  { name: 'Soft Chime', category: 'sound_effect', vibe: ['chill'], fileUrl: 'https://example.com/sounds/soft-chime.mp3', duration: 2, bpm: null, tags: ['bell', 'gentle', 'peaceful'], isRoyaltyFree: true },
  { name: 'Water Drops', category: 'sound_effect', vibe: ['chill'], fileUrl: 'https://example.com/sounds/water-drops.mp3', duration: 3, bpm: null, tags: ['nature', 'water', 'calming'], isRoyaltyFree: true },

  // Sound Effects - Funny
  { name: 'Boing', category: 'sound_effect', vibe: ['funny'], fileUrl: 'https://example.com/sounds/boing.mp3', duration: 0.8, bpm: null, tags: ['cartoon', 'bounce', 'silly'], isRoyaltyFree: true },
  { name: 'Cartoon Fall', category: 'sound_effect', vibe: ['funny'], fileUrl: 'https://example.com/sounds/cartoon-fall.mp3', duration: 1.5, bpm: null, tags: ['comedy', 'falling', 'slapstick'], isRoyaltyFree: true },
  { name: 'Slide Whistle', category: 'sound_effect', vibe: ['funny'], fileUrl: 'https://example.com/sounds/slide-whistle.mp3', duration: 1.2, bpm: null, tags: ['comedy', 'cartoon', 'slide'], isRoyaltyFree: true },
  { name: 'Ding', category: 'sound_effect', vibe: ['funny'], fileUrl: 'https://example.com/sounds/ding.mp3', duration: 0.5, bpm: null, tags: ['notification', 'bell', 'idea'], isRoyaltyFree: true },
  { name: 'Record Scratch', category: 'sound_effect', vibe: ['funny'], fileUrl: 'https://example.com/sounds/record-scratch.mp3', duration: 1, bpm: null, tags: ['stop', 'interrupt', 'comedy'], isRoyaltyFree: true },

  // Sound Effects - Dramatic
  { name: 'Cinematic Impact', category: 'sound_effect', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/cinematic-impact.mp3', duration: 2, bpm: null, tags: ['epic', 'powerful', 'dramatic'], isRoyaltyFree: true },
  { name: 'Thunder Crash', category: 'sound_effect', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/thunder-crash.mp3', duration: 3, bpm: null, tags: ['storm', 'intense', 'dramatic'], isRoyaltyFree: true },
  { name: 'Tension Rise', category: 'sound_effect', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/tension-rise.mp3', duration: 4, bpm: null, tags: ['suspense', 'build', 'anticipation'], isRoyaltyFree: true },
  { name: 'Deep Boom', category: 'sound_effect', vibe: ['dramatic'], fileUrl: 'https://example.com/sounds/deep-boom.mp3', duration: 2.5, bpm: null, tags: ['bass', 'impact', 'heavy'], isRoyaltyFree: true },

  // Sound Effects - Professional
  { name: 'Success Chime', category: 'sound_effect', vibe: ['professional'], fileUrl: 'https://example.com/sounds/success-chime.mp3', duration: 1.5, bpm: null, tags: ['notification', 'positive', 'achievement'], isRoyaltyFree: true },
  { name: 'Click', category: 'sound_effect', vibe: ['professional'], fileUrl: 'https://example.com/sounds/click.mp3', duration: 0.3, bpm: null, tags: ['button', 'interface', 'clean'], isRoyaltyFree: true },
  { name: 'Notification Tone', category: 'sound_effect', vibe: ['professional'], fileUrl: 'https://example.com/sounds/notification-tone.mp3', duration: 1, bpm: null, tags: ['alert', 'message', 'digital'], isRoyaltyFree: true },
]

async function main() {
  console.log('🎵 Seeding sound assets...')

  for (const sound of soundAssets) {
    try {
      await prisma.soundAsset.create({
        data: sound
      })
      console.log(`✓ Created sound: ${sound.name} (${sound.category})`)
    } catch (error) {
      console.log(`✗ Failed to create sound: ${sound.name}`, error.message)
    }
  }

  console.log('\n📊 Summary:')
  const stats = await prisma.soundAsset.groupBy({
    by: ['category'],
    _count: true
  })
  
  stats.forEach(stat => {
    console.log(`  ${stat.category}: ${stat._count} assets`)
  })

  console.log('\n✅ Seeding completed!')
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
