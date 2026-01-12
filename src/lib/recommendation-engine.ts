import { prisma } from './prisma'

interface RecommendationResult {
  vibeId: string
  vibeName: string
  confidence: number
  reason: string
}

interface EditingPattern {
  presetCounts: Record<string, number>
  avgJumpCutFrequency: number
  avgMusicVolume: number
  totalEdits: number
}

/**
 * Recommendation Engine
 * Analyzes user's editing history to suggest best vibe presets for new content
 */
export class RecommendationEngine {
  
  /**
   * Get top 3 recommended vibes for a user
   */
  async getRecommendations(
    userId: string,
    contentType?: string
  ): Promise<RecommendationResult[]> {
    try {
      // 1. Get user profile for creator type
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId },
      })

      // 2. Get editing history (approved edits only)
      const editingHistory = await prisma.editingHistory.findMany({
        where: {
          userId,
          approved: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50, // Last 50 approved edits
      })

      // 3. Analyze patterns
      const patterns = this.analyzePatterns(editingHistory)

      // 4. Get all available presets
      const presets = await prisma.editingPreset.findMany({
        where: { isPublic: true },
      })

      // 5. Calculate scores for each preset
      const scores = presets.map((preset) => {
        const score = this.calculateScore(
          preset,
          patterns,
          userProfile,
          contentType
        )
        return {
          vibeId: preset.id,
          vibeName: preset.name,
          confidence: score.confidence,
          reason: score.reason,
        }
      })

      // 6. Sort by confidence and return top 3
      return scores
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
    } catch (error) {
      console.error('Recommendation engine error:', error)
      
      // Fallback: Return creator type defaults
      return this.getFallbackRecommendations(userId)
    }
  }

  /**
   * Analyze user's editing patterns
   */
  private analyzePatterns(history: any[]): EditingPattern {
    const presetCounts: Record<string, number> = {}
    let totalJumpCut = 0
    let totalMusicVolume = 0
    let jumpCutCount = 0
    let musicVolumeCount = 0

    history.forEach((entry) => {
      // Count preset usage
      if (entry.presetUsed) {
        presetCounts[entry.presetUsed] = (presetCounts[entry.presetUsed] || 0) + 1
      }

      // Extract manual adjustments
      if (entry.manualAdjustments) {
        const adjustments = entry.manualAdjustments as any
        
        if (adjustments.jumpCutFrequency !== undefined) {
          totalJumpCut += adjustments.jumpCutFrequency
          jumpCutCount++
        }
        
        if (adjustments.musicVolume !== undefined) {
          totalMusicVolume += adjustments.musicVolume
          musicVolumeCount++
        }
      }
    })

    return {
      presetCounts,
      avgJumpCutFrequency: jumpCutCount > 0 ? totalJumpCut / jumpCutCount : 5,
      avgMusicVolume: musicVolumeCount > 0 ? totalMusicVolume / musicVolumeCount : 70,
      totalEdits: history.length,
    }
  }

  /**
   * Calculate confidence score for a preset
   */
  private calculateScore(
    preset: any,
    patterns: EditingPattern,
    userProfile: any,
    contentType?: string
  ): { confidence: number; reason: string } {
    let score = 0
    const reasons: string[] = []

    // Factor 1: Historical usage (40% weight)
    const usageCount = patterns.presetCounts[preset.name] || 0
    if (usageCount > 0) {
      const usageScore = Math.min(usageCount / patterns.totalEdits, 1) * 40
      score += usageScore
      
      if (usageCount > patterns.totalEdits * 0.3) {
        reasons.push(`You use this ${Math.round((usageCount / patterns.totalEdits) * 100)}% of the time`)
      }
    }

    // Factor 2: Creator type match (30% weight)
    if (userProfile?.creatorType && preset.creatorTypes) {
      const creatorTypes = Array.isArray(preset.creatorTypes) 
        ? preset.creatorTypes 
        : [preset.creatorTypes]
      
      if (creatorTypes.includes(userProfile.creatorType)) {
        score += 30
        reasons.push('Popular with ' + this.formatCreatorType(userProfile.creatorType) + ' creators')
      }
    }

    // Factor 3: Preferred vibes (20% weight)
    if (userProfile?.preferredVibes) {
      const preferredVibes = Array.isArray(userProfile.preferredVibes)
        ? userProfile.preferredVibes
        : [userProfile.preferredVibes]
      
      if (preferredVibes.includes(preset.vibeCategory)) {
        score += 20
        reasons.push('Matches your style preferences')
      }
    }

    // Factor 4: Recent trend (10% weight)
    // Weight recent usage higher
    const recentWeight = patterns.totalEdits > 10 ? 10 : 5
    score += recentWeight

    // Normalize score to 0-100
    const confidence = Math.min(Math.round(score), 100)

    // Generate reason
    let reason = reasons.length > 0 
      ? reasons.join(' • ') 
      : 'Based on your profile'

    // Add cold start message
    if (patterns.totalEdits === 0) {
      reason = 'Recommended for ' + (userProfile?.creatorType || 'your content type')
    }

    return { confidence, reason }
  }

  /**
   * Get fallback recommendations (cold start)
   */
  private async getFallbackRecommendations(userId: string): Promise<RecommendationResult[]> {
    try {
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId },
      })

      const creatorType = userProfile?.creatorType
      const preferredVibes = userProfile?.preferredVibes || []

      // Get presets matching creator type
      const presets = await prisma.editingPreset.findMany({
        where: {
          isPublic: true,
          OR: [
            { creatorTypes: { has: creatorType } },
            { vibeCategory: { in: preferredVibes as string[] } },
          ],
        },
        orderBy: { usageCount: 'desc' },
        take: 3,
      })

      return presets.map((preset, index) => ({
        vibeId: preset.id,
        vibeName: preset.name,
        confidence: 75 - (index * 10), // 75, 65, 55
        reason: 'Popular with ' + this.formatCreatorType(creatorType || 'creators'),
      }))
    } catch (error) {
      console.error('Fallback recommendations error:', error)
      
      // Ultimate fallback: Return most popular presets
      return [
        { vibeId: 'energetic', vibeName: 'Energetic', confidence: 70, reason: 'Most popular overall' },
        { vibeId: 'professional', vibeName: 'Professional', confidence: 60, reason: 'Versatile choice' },
        { vibeId: 'chill', vibeName: 'Chill Vibes', confidence: 50, reason: 'Relaxed style' },
      ]
    }
  }

  /**
   * Format creator type for display
   */
  private formatCreatorType(type: string): string {
    const typeMap: Record<string, string> = {
      food: 'Food & Cooking',
      fashion: 'Fashion',
      travel: 'Travel',
      automotive: 'Automotive',
      music: 'Music',
      cosplay: 'Cosplay',
      photography: 'Photography',
      fitness: 'Fitness',
      education: 'Education',
      art: 'Art',
      gaming: 'Gaming',
      lifestyle: 'Lifestyle',
    }
    
    return typeMap[type] || type
  }
}
