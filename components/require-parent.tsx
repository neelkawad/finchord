'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export function RequireParent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { member, loading } = useAuth()

  useEffect(() => {
    if (!loading && member && member.role !== 'parent') {
      router.replace('/')
    }
  }, [loading, member, router])

  if (loading || !member || member.role !== 'parent') return null
  return <>{children}</>
}
