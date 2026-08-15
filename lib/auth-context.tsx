'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { HOUSEHOLD_ID } from '@/lib/constants'

export type Role = 'parent' | 'kid'

export interface HouseholdMember {
  id: string
  name: string
  role: Role
  initials: string
  color: string
  email: string
  monthlyIncome: number
  incomeLabel: string
}

interface AuthContextValue {
  user: User | null
  member: HouseholdMember | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [member, setMember] = useState<HouseholdMember | null>(null)
  const [authResolved, setAuthResolved] = useState(false)
  const [memberResolved, setMemberResolved] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthResolved(true)
      if (!u) {
        setMember(null)
        setMemberResolved(true)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    setMemberResolved(false)
    const ref = doc(db, 'households', HOUSEHOLD_ID, 'members', user.uid)
    return onSnapshot(ref, (snap) => {
      setMember(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<HouseholdMember, 'id'>) }) : null)
      setMemberResolved(true)
    })
  }, [user])

  const loading = !authResolved || (!!user && !memberResolved)

  return (
    <AuthContext.Provider value={{ user, member, loading, signOut: () => firebaseSignOut(auth) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
