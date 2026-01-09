'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AICalendarChatProps {
  open: boolean
  onClose: () => void
  onCalendarCreated?: () => void
}

export function AICalendarChat({ open, onClose, onCalendarCreated }: AICalendarChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome! I can help you create a personalized training calendar. Tell me about your goals, preferred activities, and how often you want to train.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationContext, setConversationContext] = useState<{
    goals?: string[]
    activities?: string[]
    frequency?: string
    startDate?: string
    endDate?: string
  }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Parse user input for key information
      const lowerInput = input.toLowerCase()
      const newContext = { ...conversationContext }

      // Extract goals
      if (lowerInput.includes('goal') || lowerInput.includes('tavoite') || lowerInput.includes('target')) {
        const goalMatches = input.match(/(?:goal|tavoite|target)[\s:]+(.+)/i)
        if (goalMatches) {
          newContext.goals = [goalMatches[1]]
        }
      }

      // Extract activities
      const activities: string[] = []
      const activityKeywords = {
        run: ['run', 'juoksu', 'running', 'jogging'],
        strength: ['strength', 'voima', 'kunto', 'gym', 'salitreeni'],
        swim: ['swim', 'uinti', 'swimming'],
        cycling: ['cycling', 'pyöräily', 'bike'],
        yoga: ['yoga', 'jooga'],
        pilates: ['pilates'],
      }
      
      for (const [activity, keywords] of Object.entries(activityKeywords)) {
        if (keywords.some(keyword => lowerInput.includes(keyword))) {
          activities.push(activity)
        }
      }
      if (activities.length > 0) {
        newContext.activities = activities
      }

      // Extract frequency
      if (lowerInput.includes('times per week') || lowerInput.includes('kertaa viikossa')) {
        const freqMatch = input.match(/(\d+)\s*(?:times per week|kertaa viikossa)/i)
        if (freqMatch) {
          newContext.frequency = freqMatch[1]
        }
      }

      // Extract dates - try multiple patterns
      const datePatterns = [
        /(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/g, // dd.mm.yyyy or dd/mm/yyyy
        /(\d{4}-\d{2}-\d{2})/g, // yyyy-mm-dd
        /(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi, // Month day, year
        /(tammikuu|helmikuu|maaliskuu|huhtikuu|toukokuu|kesäkuu|heinäkuu|elokuu|syyskuu|lokakuu|marraskuu|joulukuu)\s+\d{1,2},?\s+\d{4}/gi, // Finnish months
      ]
      
      for (const pattern of datePatterns) {
        const dates = input.match(pattern)
        if (dates && dates.length >= 2) {
          newContext.startDate = dates[0]
          newContext.endDate = dates[1]
          break
        } else if (dates && dates.length === 1) {
          // If only one date found, ask for the other
          newContext.startDate = dates[0]
        }
      }
      
      // Also check for relative dates like "next week", "in 3 months"
      if (lowerInput.includes('start') && lowerInput.includes('today') || lowerInput.includes('now')) {
        newContext.startDate = new Date().toLocaleDateString('fi-FI')
      }
      if (lowerInput.includes('end') && (lowerInput.includes('month') || lowerInput.includes('kuukausi'))) {
        const months = input.match(/(\d+)\s*(?:month|kuukausi)/i)
        if (months) {
          const endDate = new Date()
          endDate.setMonth(endDate.getMonth() + parseInt(months[1]))
          newContext.endDate = endDate.toLocaleDateString('fi-FI')
        }
      }

      setConversationContext(newContext)

      // Generate AI response
      let assistantResponse = ''
      
      // Check if we have enough information to create calendar
      const hasEnoughInfo = newContext.goals && newContext.goals.length > 0 && 
                           newContext.activities && newContext.activities.length > 0

      if (hasEnoughInfo && newContext.startDate && newContext.endDate) {
        assistantResponse = `Perfect! I have all the information I need:
- **Goals**: ${newContext.goals.join(', ')}
- **Activities**: ${newContext.activities.join(', ')}
- **Frequency**: ${newContext.frequency || '3'} times per week
- **Start date**: ${newContext.startDate}
- **End date**: ${newContext.endDate}

Would you like me to create your personalized training calendar now? Just say "yes" or "create calendar" to proceed!`
      } else {
        // Ask for missing information
        const missing: string[] = []
        if (!newContext.goals || newContext.goals.length === 0) {
          missing.push('your training goals')
        }
        if (!newContext.activities || newContext.activities.length === 0) {
          missing.push('preferred activities (e.g., running, strength training, swimming)')
        }
        if (!newContext.startDate || !newContext.endDate) {
          missing.push('start and end dates for your training plan')
        }

        if (missing.length > 0) {
          assistantResponse = `I need a bit more information to create your calendar. Could you please tell me about:\n- ${missing.join('\n- ')}`
        } else {
          assistantResponse = `I understand. ${newContext.goals ? `Your goals: ${newContext.goals.join(', ')}. ` : ''}${newContext.activities ? `Activities: ${newContext.activities.join(', ')}. ` : ''}Tell me more about your training preferences, or say "create calendar" when you're ready!`
        }
      }

      // Check if user wants to create calendar
      if (lowerInput.includes('yes') || lowerInput.includes('create') || lowerInput.includes('luo') || lowerInput.includes('kyllä')) {
        if (hasEnoughInfo && newContext.startDate && newContext.endDate) {
          // Create calendar
          await createCalendar(newContext)
          return
        } else {
          assistantResponse = "I need a bit more information first. Please tell me:\n- Your training goals\n- Preferred activities (e.g., running, strength training, swimming)\n- Start and end dates for your training plan"
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing message:', error)
      toast({
        title: 'Error',
        description: 'Failed to process message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createCalendar = async (context: typeof conversationContext) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/calendars/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Training Plan - ${new Date().toLocaleDateString()}`,
          goals: context.goals || [],
          activities: context.activities || [],
          frequency: context.frequency || '3',
          startDate: context.startDate,
          endDate: context.endDate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create calendar')
      }

      const result = await response.json()

      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Perfect! I've created your training calendar "${result.name}". Your personalized plan is ready! You can now view it in your calendar.`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, successMessage])
      
      toast({
        title: 'Calendar created',
        description: 'Your training calendar has been created successfully.',
      })

      setTimeout(() => {
        onCalendarCreated?.()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error creating calendar:', error)
      toast({
        title: 'Error',
        description: 'Failed to create calendar. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Training Calendar with AI
          </DialogTitle>
          <DialogDescription>
            Tell me about your goals, activities, and training frequency to create a personalized plan
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground text-sm font-medium">
                    {message.content.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me about your training goals, activities, and preferences..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <button className="hover:text-foreground transition-colors">
                📎 Attach
              </button>
              <button className="hover:text-foreground transition-colors">
                🎤 Voice Message
              </button>
              <button className="hover:text-foreground transition-colors">
                🔍 Browse Prompts
              </button>
            </div>
            <span>{input.length}/3,000</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

