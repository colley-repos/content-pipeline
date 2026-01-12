'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Utensils, 
  Shirt, 
  Plane, 
  Car, 
  Music, 
  Drama,
  Camera,
  Dumbbell,
  BookOpen,
  Palette,
  Gamepad2,
  Heart,
  Check
} from 'lucide-react'

const CREATOR_TYPES = [
  { id: 'food', name: 'Food & Cooking', icon: Utensils, vibes: ['energetic', 'chill', 'professional'] },
  { id: 'fashion', name: 'Fashion & Style', icon: Shirt, vibes: ['professional', 'energetic', 'dramatic'] },
  { id: 'travel', name: 'Travel & Adventure', icon: Plane, vibes: ['energetic', 'chill', 'dramatic'] },
  { id: 'automotive', name: 'Cars & Automotive', icon: Car, vibes: ['energetic', 'professional', 'dramatic'] },
  { id: 'music', name: 'Music & Dance', icon: Music, vibes: ['energetic', 'dramatic', 'chill'] },
  { id: 'cosplay', name: 'Cosplay & Anime', icon: Drama, vibes: ['dramatic', 'energetic', 'funny'] },
  { id: 'photography', name: 'Photography', icon: Camera, vibes: ['professional', 'chill', 'dramatic'] },
  { id: 'fitness', name: 'Fitness & Health', icon: Dumbbell, vibes: ['energetic', 'professional', 'motivational'] },
  { id: 'education', name: 'Education & Learning', icon: BookOpen, vibes: ['professional', 'chill', 'energetic'] },
  { id: 'art', name: 'Art & Design', icon: Palette, vibes: ['chill', 'professional', 'dramatic'] },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, vibes: ['energetic', 'funny', 'dramatic'] },
  { id: 'lifestyle', name: 'Lifestyle & Wellness', icon: Heart, vibes: ['chill', 'professional', 'motivational'] },
]

const VIBE_DESCRIPTIONS = {
  energetic: 'Fast-paced with quick cuts and upbeat music',
  chill: 'Relaxed vibe with smooth transitions',
  professional: 'Clean, polished, business-focused',
  dramatic: 'Bold effects and emotional music',
  funny: 'Comedic timing with playful effects',
  motivational: 'Inspiring music and powerful messaging',
}

interface OnboardingWizardProps {
  onComplete: (creatorType: string, vibes: string[]) => void
  onSkip?: () => void
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const type = CREATOR_TYPES.find(t => t.id === typeId)
    if (type) {
      // Pre-select recommended vibes for this creator type
      setSelectedVibes(type.vibes.slice(0, 2))
    }
  }

  const toggleVibe = (vibe: string) => {
    if (selectedVibes.includes(vibe)) {
      setSelectedVibes(selectedVibes.filter(v => v !== vibe))
    } else {
      setSelectedVibes([...selectedVibes, vibe])
    }
  }

  const handleContinue = () => {
    if (step === 1 && selectedType) {
      setStep(2)
    } else if (step === 2 && selectedVibes.length > 0) {
      onComplete(selectedType!, selectedVibes)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">
              {step === 1 ? "What type of content do you create?" : "Choose your vibe"}
            </h2>
            <p className="text-gray-600">
              {step === 1 
                ? "This helps us recommend the best editing styles for your videos"
                : "Select editing styles you&apos;d like us to apply to your content"
              }
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <div className={`h-2 w-12 rounded ${step >= 1 ? 'bg-purple-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-12 rounded ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`} />
            </div>
          </div>

          {/* Step 1: Creator Type Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CREATOR_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all hover:border-purple-400 ${
                      isSelected 
                        ? 'border-purple-600 bg-purple-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-purple-600' : 'text-gray-600'}`} />
                      <span className={`font-medium text-sm ${isSelected ? 'text-purple-600' : 'text-gray-900'}`}>
                        {type.name}
                      </span>
                      {isSelected && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Vibe Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {Object.entries(VIBE_DESCRIPTIONS).map(([vibe, description]) => {
                  const isSelected = selectedVibes.includes(vibe)
                  const isRecommended = selectedType && 
                    CREATOR_TYPES.find(t => t.id === selectedType)?.vibes.includes(vibe)
                  
                  return (
                    <button
                      key={vibe}
                      onClick={() => toggleVibe(vibe)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-purple-600 bg-purple-50' 
                          : 'border-gray-200 hover:bg-gray-50 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold capitalize ${
                              isSelected ? 'text-purple-600' : 'text-gray-900'
                            }`}>
                              {vibe}
                            </span>
                            {isRecommended && (
                              <Badge variant="outline" className="text-xs">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{description}</p>
                        </div>
                        {isSelected && (
                          <Check className="w-6 h-6 text-purple-600 ml-4" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> You can select multiple vibes! Our AI will learn your preferences and suggest the best styles for each video.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                if (step === 2) {
                  setStep(1)
                } else if (onSkip) {
                  onSkip()
                }
              }}
            >
              {step === 2 ? 'Back' : 'Skip for now'}
            </Button>
            
            <Button
              onClick={handleContinue}
              disabled={step === 1 ? !selectedType : selectedVibes.length === 0}
              className="min-w-[120px]"
            >
              {step === 1 ? 'Continue' : 'Get Started'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
