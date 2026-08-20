'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Target,
  Landmark,
  FileText,
  MoreHorizontal,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { MemberAvatar } from '@/components/ui/member-avatar'

const primaryNavItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard, parentOnly: false },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight, parentOnly: false },
  { href: '/debts', label: 'Debt', icon: CreditCard, parentOnly: false },
  { href: '/goals', label: 'Savings', icon: Target, parentOnly: true },
]

const moreNavItems = [
  { href: '/accounts', label: 'Retirement', icon: Landmark, parentOnly: true },
  { href: '/reports', label: 'Reports', icon: FileText, parentOnly: true },
]

const navItems = [...primaryNavItems, ...moreNavItems]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 18V9M12 18V6M18 18v-4"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!collapsed && (
        <span className="text-lg font-semibold tracking-tight text-foreground">FinChord</span>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, member, loading, signOut } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (loading) return
    if (!user && !isLoginPage) {
      router.replace('/login')
    } else if (user && isLoginPage) {
      router.replace('/')
    }
  }, [loading, user, isLoginPage, router])

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (loading || !user || !member) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const visibleNavItems = navItems.filter((item) => !item.parentOnly || member.role === 'parent')
  const visiblePrimaryItems = primaryNavItems.filter((item) => !item.parentOnly || member.role === 'parent')
  const visibleMoreItems = moreNavItems.filter((item) => !item.parentOnly || member.role === 'parent')
  const moreActive = visibleMoreItems.some((item) => isActive(pathname, item.href))

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Primary">
          {visibleNavItems.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="size-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
          <MemberAvatar member={member} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{member.role}</p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => signOut()}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-3">
            <MemberAvatar member={member} size="sm" />
            <button
              type="button"
              aria-label="Sign out"
              onClick={() => signOut()}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
        </header>
        {children}
      </div>

      {/* Mobile "More" sheet */}
      {moreOpen && visibleMoreItems.length > 0 && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
          />
          <div className="fixed inset-x-0 bottom-16 z-50 mx-auto w-full max-w-lg px-2 md:hidden">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              {visibleMoreItems.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 border-b border-border px-4 py-3.5 text-sm font-medium transition-colors last:border-0',
                      active ? 'text-primary' : 'text-foreground hover:bg-accent/50',
                    )}
                  >
                    <item.icon className="size-[18px]" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
          {visiblePrimaryItems.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  <item.icon className={cn('size-5', active && 'stroke-[2.4]')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
          {visibleMoreItems.length > 0 && (
            <li className="flex-1">
              <button
                type="button"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  'flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  moreActive || moreOpen ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <MoreHorizontal className={cn('size-5', (moreActive || moreOpen) && 'stroke-[2.4]')} />
                More
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  )
}
