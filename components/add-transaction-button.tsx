import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AddTransactionButton({
  className,
  label = 'Add Transaction',
}: {
  className?: string
  label?: string
}) {
  return (
    <Link
      href="/add"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <Plus className="size-4" />
      {label}
    </Link>
  )
}

export function FloatingAddButton() {
  return (
    <Link
      href="/add"
      aria-label="Add transaction"
      className="fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:bottom-8 md:right-8"
    >
      <Plus className="size-6" />
    </Link>
  )
}
