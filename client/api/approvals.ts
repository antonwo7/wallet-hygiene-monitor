import { apiFetch } from '../lib/apiFetch'
import type { ApprovalEventFeedItem, ApprovalKind, Chain } from './types'

export const approvalsApi = {
  feed: (params?: {
    chain?: Chain
    kind?: ApprovalKind
    minRisk?: number
    skip?: number
    take?: number
  }) => {
    const q = new URLSearchParams()
    if (params?.chain) q.set('chain', params.chain)
    if (params?.kind) q.set('kind', params.kind)
    if (typeof params?.minRisk === 'number') q.set('minRisk', String(params.minRisk))
    if (typeof params?.skip === 'number') q.set('skip', String(params.skip))
    if (typeof params?.take === 'number') q.set('take', String(params.take))
    const suffix = q.toString() ? `?${q.toString()}` : ''
    return apiFetch<ApprovalEventFeedItem[]>(`/approvals${suffix}`)
  },
}
