'use client'

import { useMemo, useState } from 'react'
import type { ApprovalEventFeedItem, ApprovalKind, Chain, RiskLevel } from '../../../lib/api'
import { Button, Card } from '../../../components/Ui'
import { useAllowlistAdd } from '../../../hooks/useAllowlist'
import { useApprovalsList } from '../../../hooks/useApprovals'

const CHAINS: { value: Chain | ''; label: string }[] = [
	{ value: '', label: 'All chains' },
	{ value: 'ethereum', label: 'Ethereum' },
	{ value: 'polygon', label: 'Polygon' },
	{ value: 'arbitrum', label: 'Arbitrum' }
]

const KINDS: { value: ApprovalKind | ''; label: string }[] = [
	{ value: '', label: 'All types' },
	{ value: 'ERC20_APPROVAL', label: 'ERC-20 Approval' },
	{ value: 'APPROVAL_FOR_ALL', label: 'ApprovalForAll (NFT)' }
]

const MIN_RISK: { value: number; label: string }[] = [
	{ value: 0, label: 'All (riskScore ≥ 0)' },
	{ value: 1, label: 'Any risky (riskScore ≥ 1)' },
	{ value: 30, label: 'Medium+ (riskScore ≥ 30)' },
	{ value: 60, label: 'High+ (riskScore ≥ 60)' },
	{ value: 90, label: 'Critical (riskScore ≥ 90)' }
]

function reasonsOf(e: ApprovalEventFeedItem): string[] {
	const r = (e as any)?.riskMeta?.reasons
	return Array.isArray(r) ? (r as string[]) : []
}

export default function ApprovalsPage() {
	const [chain, setChain] = useState<Chain | ''>('')
	const [kind, setKind] = useState<ApprovalKind | ''>('')
	const [minRisk, setMinRisk] = useState<number>(1)
	const [page, setPage] = useState(0)
	const take = 25

	const query = useMemo(
		() => ({
			chain: chain || undefined,
			kind: kind || undefined,
			minRisk,
			skip: page * take,
			take
		}),
		[chain, kind, minRisk, page]
	)

	const { items, isLoading: loading, reload } = useApprovalsList(query)
	const { add: addTrusted } = useAllowlistAdd()

	const canPrev = page > 0
	const canNext = items.length === take

	const summary = useMemo(() => {
		const counts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
		for (const it of items) counts[it.riskLevel] = (counts[it.riskLevel] ?? 0) + 1
		return counts
	}, [items])

	async function markTrusted(event: ApprovalEventFeedItem) {
		const res = await addTrusted({ chain: event.chain, spender: event.spender })
		if (!res) return
		await reload()
	}

	return (
		<div className="space-y-6">
			<Card title="Approvals feed" subtitle="Detected approval events with computed risk.">
				<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
					<label className="block">
						<span className="text-sm font-medium text-slate-700">Chain</span>
						<select
							value={chain}
							onChange={e => {
								setPage(0)
								setChain(e.target.value as any)
							}}
							className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
						>
							{CHAINS.map(c => (
								<option key={c.label} value={c.value}>
									{c.label}
								</option>
							))}
						</select>
					</label>

					<label className="block">
						<span className="text-sm font-medium text-slate-700">Type</span>
						<select
							value={kind}
							onChange={e => {
								setPage(0)
								setKind(e.target.value as any)
							}}
							className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
						>
							{KINDS.map(k => (
								<option key={k.label} value={k.value}>
									{k.label}
								</option>
							))}
						</select>
					</label>

					<label className="block">
						<span className="text-sm font-medium text-slate-700">Min risk</span>
						<select
							value={String(minRisk)}
							onChange={e => {
								setPage(0)
								setMinRisk(Number(e.target.value))
							}}
							className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
						>
							{MIN_RISK.map(r => (
								<option key={r.value} value={String(r.value)}>
									{r.label}
								</option>
							))}
						</select>
					</label>

					<div className="flex items-end gap-2">
						<Button variant="secondary" onClick={() => reload()} disabled={loading}>
							{loading ? 'Loading…' : 'Refresh'}
						</Button>
					</div>
				</div>

				<div className="mt-4 text-sm text-slate-600 flex flex-wrap gap-2">
					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
						LOW: <b>{summary.LOW}</b>
					</span>
					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
						MEDIUM: <b>{summary.MEDIUM}</b>
					</span>
					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
						HIGH: <b>{summary.HIGH}</b>
					</span>
					<span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
						CRITICAL: <b>{summary.CRITICAL}</b>
					</span>
				</div>

				<div className="mt-6 overflow-x-auto">
					<table className="w-full border-collapse">
						<thead>
							<tr className="text-left text-sm text-slate-600">
								<th className="py-2 pr-3">Risk</th>
								<th className="py-2 pr-3">Type</th>
								<th className="py-2 pr-3">Token</th>
								<th className="py-2 pr-3">Spender/Operator</th>
								<th className="py-2 pr-3">Details</th>
								<th className="py-2 pr-3">Reasons</th>
								<th className="py-2">Tx</th>
							</tr>
						</thead>
						<tbody className="text-sm">
							{loading ? (
								<tr>
									<td colSpan={7} className="py-6 text-slate-500">
										Loading…
									</td>
								</tr>
							) : items.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-6 text-slate-500">
										No events found.
									</td>
								</tr>
							) : (
								items.map(e => (
									<tr key={e.id} className="border-t border-slate-100">
										<td className="py-3 pr-3 align-top">
											<RiskBadge level={e.riskLevel} score={e.riskScore} />
											<div className="mt-2 text-xs text-slate-500">{e.chain}</div>
										</td>
										<td className="py-3 pr-3 align-top whitespace-nowrap">{labelKind(e.kind)}</td>
										<td className="py-3 pr-3 align-top font-mono text-xs">{e.tokenAddress}</td>
										<td className="py-3 pr-3 align-top">
											<div className="font-mono text-xs break-all">{e.spender}</div>
											<div className="mt-2">
												<Button variant="secondary" onClick={() => markTrusted(e)}>
													Mark trusted
												</Button>
											</div>
										</td>
										<td className="py-3 pr-3 align-top">
											<div className="text-xs text-slate-500">Block: {String(e.blockNumber)}</div>
											{e.rawValue ? (
												<div className="mt-1">
													<span className="text-slate-600">Value:</span>{' '}
													<span className="font-mono text-xs">{e.rawValue}</span>
												</div>
											) : (
												<div className="mt-1">
													<span className="text-slate-600">Approved for all:</span>{' '}
													<b>{String(e.approved)}</b>
												</div>
											)}
											<div className="mt-1 font-mono text-xs text-slate-500 break-all">{e.txHash}</div>
										</td>
										<td className="py-3 pr-3 align-top">
											<Reasons reasons={reasonsOf(e)} />
										</td>
										<td className="py-3 align-top whitespace-nowrap">
											<a
												href={txUrlFor(e)}
												target="_blank"
												rel="noreferrer"
												className="text-slate-900 underline"
											>
												Open
											</a>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="mt-4 flex items-center justify-between">
					<Button
						variant="secondary"
						disabled={!canPrev || loading}
						onClick={() => setPage(p => Math.max(0, p - 1))}
					>
						Prev
					</Button>
					<div className="text-sm text-slate-600">Page {page + 1}</div>
					<Button variant="secondary" disabled={!canNext || loading} onClick={() => setPage(p => p + 1)}>
						Next
					</Button>
				</div>
			</Card>

			<Card title="What to do" subtitle="Quick guidance (MVP)">
				<ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
					<li>If you don’t recognize the spender/operator, consider revoking the approval.</li>
					<li>ApprovalForAll (NFT) is often more dangerous than ERC-20 approvals.</li>
					<li>Use allowlist to reduce noise for trusted protocols.</li>
				</ul>
			</Card>
		</div>
	)
}

function labelKind(kind: ApprovalKind) {
	return kind === 'ERC20_APPROVAL' ? 'ERC-20 Approval' : 'ApprovalForAll'
}

function txUrlFor(e: ApprovalEventFeedItem): string {
	const base =
		e.chain === 'ethereum'
			? 'https://etherscan.io/tx/'
			: e.chain === 'polygon'
				? 'https://polygonscan.com/tx/'
				: 'https://arbiscan.io/tx/'
	return `${base}${e.txHash}`
}

function RiskBadge({ level, score }: { level: RiskLevel; score: number }) {
	const cls =
		level === 'CRITICAL'
			? 'bg-rose-50 text-rose-700 border-rose-200'
			: level === 'HIGH'
				? 'bg-orange-50 text-orange-700 border-orange-200'
				: level === 'MEDIUM'
					? 'bg-amber-50 text-amber-800 border-amber-200'
					: 'bg-slate-50 text-slate-700 border-slate-200'
	return (
		<div>
			<span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}>
				{level}
			</span>
			<div className="mt-1 text-xs text-slate-500">score: {score}</div>
		</div>
	)
}

function Reasons({ reasons }: { reasons: string[] }) {
	if (!reasons || reasons.length === 0) return <span className="text-xs text-slate-500">—</span>
	return (
		<ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
			{reasons.slice(0, 5).map((r, idx) => (
				<li key={`${r}-${idx}`}>{r}</li>
			))}
			{reasons.length > 5 ? <li className="text-slate-500">+{reasons.length - 5} more</li> : null}
		</ul>
	)
}
