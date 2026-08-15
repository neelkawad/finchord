import Link from 'next/link'
import { Plus } from 'lucide-react'

export function FloatingActionButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed bottom-24 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:bottom-8 md:right-8"
    >
      <Plus className="size-6" />
    </Link>
  )
}
