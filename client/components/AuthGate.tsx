'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardHeader from './DashboardHeader'
import DashboardNav from './DashboardNav'
import { useLogout, useMe } from '../hooks/useAuth'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useMe()
  const { logout: doLogout } = useLogout()

  useEffect(() => {
    if (!isLoading && !user) router.replace('/')
  }, [isLoading, user, router])

  async function logout() {
    await doLogout()
    router.replace('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Not authenticated</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} onLogout={logout} />
      <DashboardNav />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6">{children}</main>
    </div>
  )
}
