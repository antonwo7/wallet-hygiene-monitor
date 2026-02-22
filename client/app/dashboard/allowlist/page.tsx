'use client'

import { useState } from 'react'
import type { Chain, TrustedSpender } from '../../../lib/api'
import { Button, Card, Input } from '../../../components/Ui'
import { useAllowlistAdd, useAllowlistList, useAllowlistRemove } from '../../../hooks/useAllowlist'

const CHAINS: { value: Chain | ''; label: string }[] = [
  { value: '', label: 'All chains' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum' },
]

export default function AllowlistPage() {
  const [chainFilter, setChainFilter] = useState<Chain | ''>('')
  const { items, isLoading: loading, reload } = useAllowlistList(chainFilter || undefined)
  const { add, isLoading: saving } = useAllowlistAdd()
  const { remove } = useAllowlistRemove()

  const [chain, setChain] = useState<Chain>('ethereum')
  const [spender, setSpender] = useState('')
  const [label, setLabel] = useState('')

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const res = await add({ chain, spender, label: label || undefined })
    if (!res) return
    setSpender('')
    setLabel('')
    await reload()
  }

  async function removeItem(it: TrustedSpender) {
    await remove(it.chain, it.spender)
    await reload()
  }

  return (
    <div className="space-y-6">
      <Card
        title="Allowlist"
        subtitle={'Trusted spenders/operators reduce noise ("not in allowlist" risk reason disappears).'}
      >
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Filter by chain</span>
            <select
              value={chainFilter}
              onChange={(e) => setChainFilter(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              {CHAINS.map((c) => (
                <option key={c.label} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2 flex items-end">
            <Button variant="secondary" onClick={() => reload()} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </Button>
          </div>
        </div>

        <form onSubmit={addItem} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Chain</span>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as Chain)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              {CHAINS.filter((c) => c.value).map((c) => (
                <option key={c.label} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <Input label="Spender/Operator" value={spender} onChange={setSpender} placeholder="0x…" />
          <Input label="Label (optional)" value={label} onChange={setLabel} placeholder="Uniswap Router" />

          <div className="flex items-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
          </div>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-sm text-slate-600">
                <th className="py-2 pr-3">Chain</th>
                <th className="py-2 pr-3">Spender</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-slate-500">
                    Allowlist is empty.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={`${it.chain}:${it.spender}`} className="border-t border-slate-100">
                    <td className="py-3 pr-3">{it.chain}</td>
                    <td className="py-3 pr-3 font-mono text-xs break-all">{it.spender}</td>
                    <td className="py-3 pr-3">{it.label ?? <span className="text-slate-500">—</span>}</td>
                    <td className="py-3">
                      <Button variant="danger" onClick={() => removeItem(it)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Tip" subtitle="Noise reduction">
        <p className="text-sm text-slate-700">
          When you frequently interact with a known protocol, add its router/operator to the allowlist so alerts focus on
          unknown approvals.
        </p>
      </Card>
    </div>
  )
}
