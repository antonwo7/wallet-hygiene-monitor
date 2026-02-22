'use client'

import type { User } from '../lib/api'

export default function DashboardHeader({ user, onLogout }: { user: User; onLogout: () => void }) {
	return (
		<header className="border-b border-slate-200 bg-white">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-semibold">
						WHM
					</div>
					<div>
						<div className="text-sm text-slate-600">Logged in as</div>
						<div className="text-base font-semibold text-slate-900 flex items-center gap-2">
							<UserIcon />
							<span>
								{user.firstName} {user.lastName} <span className="text-slate-500">({user.nickname})</span>
							</span>
						</div>
					</div>
				</div>

				<button
					onClick={onLogout}
					className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
				>
					Logout
				</button>
			</div>
		</header>
	)
}

function UserIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="h-5 w-5 text-slate-600"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M20 21a8 8 0 0 0-16 0" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	)
}
