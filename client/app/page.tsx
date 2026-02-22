'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthCard from '../components/AuthCard'
import { useMe } from '../hooks/useAuth'

export default function HomePage() {
	const router = useRouter()
	const { user, isLoading } = useMe()

	useEffect(() => {
		if (!isLoading && user) {
			router.replace('/dashboard')
		}
	}, [isLoading, user, router])

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-slate-500">Loading…</div>
			</div>
		)
	}

	return (
		<main className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-5xl">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-semibold tracking-tight text-slate-900">Wallet Hygiene Monitor</h1>
					<p className="mt-2 text-slate-600">Register or sign in to manage your wallets.</p>
				</div>

				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<AuthCard mode="login" />
					<AuthCard mode="register" />
				</div>

				<div className="mt-8 text-center text-xs text-slate-500">
					Cookies are HTTP-only. Authentication is handled securely on the backend.
				</div>
			</div>
		</main>
	)
}
