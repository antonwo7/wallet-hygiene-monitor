'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRequestPasswordReset } from '../../hooks/useAuthActions'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { requestReset, isLoading: loading } = useRequestPasswordReset()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await requestReset({ email })
    if (res) setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we&#39;ll send you a reset link (if the account exists).
        </p>

        {sent ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            If the email exists, a reset link has been sent. Check your inbox.
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
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
