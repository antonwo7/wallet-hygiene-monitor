import { apiFetch } from '../lib/apiFetch'
import type { Chain, Wallet } from './types'

export const walletsApi = {
	list: () => apiFetch<Wallet[]>('/wallets'),

	add: (payload: { chain: Chain; address: string }) =>
		apiFetch<Wallet>('/wallets', { method: 'POST', body: JSON.stringify(payload) }),

	disable: (walletId: string) => apiFetch<{ ok: true }>(`/wallets/${walletId}/disable`, { method: 'PATCH' }),

	enable: (walletId: string) => apiFetch<{ ok: true }>(`/wallets/${walletId}/enable`, { method: 'PATCH' })
}
