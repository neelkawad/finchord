import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FloatingActionButton } from '@/components/ui/floating-action-button'

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
  return <FloatingActionButton href="/add" label="Add transaction" />
}
