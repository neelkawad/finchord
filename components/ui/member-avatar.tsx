import { cn } from '@/lib/utils'
import type { Member } from '@/lib/data'

const sizeMap = {
  sm: 'size-7 text-[11px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
}

export function MemberAvatar({
  member,
  size = 'md',
  className,
}: {
  member: Member
  size?: keyof typeof sizeMap
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizeMap[size],
        className,
      )}
      style={{ backgroundColor: member.color }}
      aria-hidden="true"
    >
      {member.initials}
    </span>
  )
}
