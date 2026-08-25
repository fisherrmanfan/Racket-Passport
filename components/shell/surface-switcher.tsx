'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Store, User } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The three surfaces are genuinely different products sharing a codebase
 * (FRONTEND doc §1.1), and until there's real auth there has to be a visible
 * way to cross between them. This is that door — a build-time affordance, not
 * a shipping feature: once a session knows whether you're a stringer or a
 * player, the right surface is simply where you land.
 */

const SURFACES = [
  { href: '/app', label: 'Stringer', icon: Store },
  { href: '/my', label: 'Player', icon: User },
] as const

export function SurfaceSwitcher({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Switch surface" className={cn('flex items-center gap-1', className)}>
      {SURFACES.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-10 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors sm:px-3',
              active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            {/* Label folds away on a phone; the icon and title carry it there. */}
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
