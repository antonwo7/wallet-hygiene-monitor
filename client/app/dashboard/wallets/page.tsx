'use client'

import { useMemo, useState } from 'react'
import type { Chain, Wallet } from '../../../lib/api'
import { Button, Card, Input } from '../../../components/Ui'
import { useWalletAdd, useWalletDisable, useWalletEnable, useWalletsList } from '../../../hooks/useWallets'

const CHAINS: { value: Chain; label: string }[] = [
	{ value: 'ethereum', label: 'Ethereum' },
	{ value: 'polygon', label: 'Polygon' },
	{ value: 'arbitrum', label: 'Arbitrum' }
]

export default function WalletsPage() {
	const { wallets, isLoading: loading, reload } = useWalletsList()
	const { add, isLoading: adding } = useWalletAdd()
	const { disable } = useWalletDisable()
	const { enable } = useWalletEnable()

	const [chain, setChain] = useState<Chain>('ethereum')
	const [address, setAddress] = useState('')

	const activeCount = useMemo(() => wallets.filter(w => w.status === 'ACTIVE').length, [wallets])

	async function addWallet(e: React.FormEvent) {
		e.preventDefault()
		const res = await add({ chain, address })
		if (!res) return
		setAddress('')
		await reload()
	}

	async function enableWallet(walletId: string) {
		const res = await enable(walletId)
		if (res) await reload()
	}

	async function disableWallet(walletId: string) {
		const res = await disable(walletId)
		if (res) await reload()
	}

	return (
		<div className="space-y-6">
			<Card title="Wallets" subtitle={`Manage wallets you monitor. Active: ${activeCount}/${wallets.length}`}>
				<form onSubmit={addWallet} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
					<label className="block">
						<span className="text-sm font-medium text-slate-700">Chain</span>
						<select
							value={chain}
							onChange={e => setChain(e.target.value as Chain)}
							className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
						>
							{CHAINS.map(c => (
								<option key={c.value} value={c.value}>
									{c.label}
								</option>
							))}
						</select>
					</label>

					<Input label="Wallet address" value={address} onChange={setAddress} placeholder="0x…" />

					<div className="flex items-end">
						<Button type="submit" disabled={adding}>
							{adding ? 'Adding…' : 'Add wallet'}
						</Button>
					</div>
				</form>

				<div className="mt-6 overflow-x-auto">
					<table className="w-full border-collapse">
						<thead>
							<tr className="text-left text-sm text-slate-600">
								<th className="py-2 pr-3">Address</th>
								<th className="py-2 pr-3">Chain</th>
								<th className="py-2 pr-3">Status</th>
								<th className="py-2 pr-3">Backfill</th>
								<th className="py-2 pr-3">Last scanned</th>
								<th className="py-2">Actions</th>
							</tr>
						</thead>
						<tbody className="text-sm">
							{loading ? (
								<tr>
									<td colSpan={6} className="py-6 text-slate-500">
										Loading…
									</td>
								</tr>
							) : wallets.length === 0 ? (
								<tr>
									<td colSpan={6} className="py-6 text-slate-500">
										No wallets yet.
									</td>
								</tr>
							) : (
								wallets.map(w => (
									<tr key={w.id} className="border-t border-slate-100">
										<td className="py-3 pr-3 font-mono text-xs">{w.address}</td>
										<td className="py-3 pr-3">{w.chain}</td>
										<td className="py-3 pr-3">
											<Badge variant={w.status === 'ACTIVE' ? 'ok' : 'muted'}>{w.status}</Badge>
										</td>
										<td className="py-3 pr-3">
											<Badge variant="muted">{w.state?.backfillStatus ?? '—'}</Badge>
										</td>
										<td className="py-3 pr-3">
											{w.state?.lastScannedBlock !== null && w.state?.lastScannedBlock !== undefined
												? String(w.state.lastScannedBlock)
												: '—'}
										</td>
										<td className="py-3">
											{w.status === 'ACTIVE' ? (
												<Button variant="secondary" onClick={() => disableWallet(w.id)}>
													Disable
												</Button>
											) : (
												<Button variant="secondary" onClick={() => enableWallet(w.id)}>
													Enable
												</Button>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</Card>

			<Card title="Notes" subtitle="A wallet is scanned by the worker periodically.">
				<ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
					<li>New approvals (riskScore &gt; 0) trigger an email alert.</li>
					<li>Disable a wallet to stop scanning it (enable can be added later).</li>
				</ul>
			</Card>
		</div>
	)
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'ok' | 'muted' }) {
	const cls =
		variant === 'ok'
			? 'bg-emerald-50 text-emerald-700 border-emerald-200'
			: 'bg-slate-50 text-slate-700 border-slate-200'
	return (
		<span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
			{children}
		</span>
	)
}
