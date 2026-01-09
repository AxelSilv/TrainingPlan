'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, BarChart3, UtensilsCrossed, Settings, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { AICalendarChat } from '@/components/ai-calendar-chat'

const navItems = [
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
]

export function Navigation() {
  const pathname = usePathname()
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  return (
    <>
      <AICalendarChat 
        open={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)}
        onCalendarCreated={() => {
          setIsAIChatOpen(false)
          window.location.reload()
        }}
      />
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:border-r md:bg-background">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">Training Calendar</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t space-y-2">
            <Button 
              variant="default" 
              className="w-full justify-start"
              onClick={() => setIsAIChatOpen(true)}
            >
              <Sparkles className="h-5 w-5 mr-3" />
              Add a new calendar
            </Button>
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}

export function TopBar() {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false)

  return (
    <>
      <AICalendarChat 
        open={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)}
        onCalendarCreated={() => {
          setIsAIChatOpen(false)
          window.location.reload()
        }}
      />
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="flex items-center justify-between h-14 px-4 md:pl-72">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold md:hidden">Training</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/calendar?today=true">
              <Button variant="ghost" size="sm">
                Today
              </Button>
            </Link>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsAIChatOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              New Calendar
            </Button>
            <Link href="/calendar?add=true">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}

