'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { notifyError } from '../../../lib/notify'
import { useResetPassword } from '../../../hooks/useAuthActions'

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const token = params.token
  const { resetPassword, isLoading: loading } = useResetPassword()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== passwordConfirm) {
      notifyError('Passwords do not match')
      return
    }

    const res = await resetPassword({ token, password, passwordConfirm })
    if (res) {
      setDone(true)
      setTimeout(() => router.replace('/'), 800)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">Set a new password for your account.</p>

        {done ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            Password updated. Redirecting to sign in…
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">New password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="••••••••"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Confirm password</span>
            <input
              type="password"
              required
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading || done}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save new password'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/" className="text-slate-700 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
