'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
	{ href: '/dashboard', label: 'Overview' },
	{ href: '/dashboard/wallets', label: 'Wallets' },
	{ href: '/dashboard/approvals', label: 'Approvals feed' },
	{ href: '/dashboard/allowlist', label: 'Allowlist' },
	{ href: '/dashboard/settings', label: 'Settings' }
]

export default function DashboardNav() {
	const pathname = usePathname()

	return (
		<nav className="border-b border-slate-200 bg-white py-4">
			<div className="mx-auto max-w-5xl px-4 sm:px-6 py-2 flex flex-wrap gap-2">
				{items.map(it => {
					const active = pathname === it.href
					return (
						<Link
							key={it.href}
							href={it.href}
							className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
								active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
							}`}
						>
							{it.label}
						</Link>
					)
				})}
			</div>
		</nav>
	)
}
