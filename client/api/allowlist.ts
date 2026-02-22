import { apiFetch } from '../lib/apiFetch'
import type { Chain, TrustedSpender } from './types'

export const allowlistApi = {
  list: (chain?: Chain) => {
    const suffix = chain ? `?chain=${encodeURIComponent(chain)}` : ''
    return apiFetch<TrustedSpender[]>(`/allowlist${suffix}`)
  },

  add: (payload: { chain: Chain; spender: string; label?: string }) =>
    apiFetch<TrustedSpender>('/allowlist', { method: 'POST', body: JSON.stringify(payload) }),

  remove: (chain: Chain, spender: string) =>
    apiFetch<{ ok: true }>(`/allowlist/${chain}/${spender}`, { method: 'DELETE' }),
}
