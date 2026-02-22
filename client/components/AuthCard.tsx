'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLogin, useRegister } from '../hooks/useAuthActions'

export default function AuthCard({ mode }: { mode: 'login' | 'register' }) {
	const router = useRouter()
	const { login, isLoading: loginLoading } = useLogin()
	const { register, isLoading: registerLoading } = useRegister()
	const loading = mode === 'login' ? loginLoading : registerLoading

	const [nickname, setNickname] = useState('')
	const [email, setEmail] = useState('')
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [identifier, setIdentifier] = useState('')
	const [password, setPassword] = useState('')

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault()

		const res =
			mode === 'login'
				? await login({ identifier, password })
				: await register({ nickname, email, firstName, lastName, password })

		if (res) router.replace('/dashboard')
	}

	return (
		<div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
			<h2 className="text-lg font-semibold text-slate-900">
				{mode === 'login' ? 'Sign in' : 'Create account'}
			</h2>
			<p className="mt-1 text-sm text-slate-600">
				{mode === 'login' ? 'Use your nickname or email.' : 'Fill in your details to register.'}
			</p>

			<form onSubmit={onSubmit} className="mt-6 space-y-4">
				{mode === 'register' ? (
					<>
						<Field label="Nickname" value={nickname} onChange={setNickname} autoComplete="username" />
						<Field label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
							<Field label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
						</div>
					</>
				) : (
					<Field
						label="Nickname or Email"
						value={identifier}
						onChange={setIdentifier}
						autoComplete="username"
					/>
				)}

				<Field
					label="Password"
					value={password}
					onChange={setPassword}
					type="password"
					autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
				/>

				<button
					type="submit"
					disabled={loading}
					className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
				>
					{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Register'}
				</button>

				{mode === 'login' ? (
					<div className="text-right">
						<Link href="/forgot-password" className="text-sm text-slate-600 hover:text-slate-900">
							Forgot password?
						</Link>
					</div>
				) : null}
			</form>
		</div>
	)
}

function Field(props: {
	label: string
	value: string
	onChange: (v: string) => void
	type?: string
	autoComplete?: string
}) {
	return (
		<label className="block">
			<span className="text-sm font-medium text-slate-700">{props.label}</span>
			<input
				className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
				value={props.value}
				onChange={e => props.onChange(e.target.value)}
				type={props.type ?? 'text'}
				autoComplete={props.autoComplete}
				required
			/>
		</label>
	)
}
