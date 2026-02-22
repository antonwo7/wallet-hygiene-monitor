import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletsApi } from '../lib/api'
import type { Chain, Wallet } from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'

const qk = {
	list: () => ['wallets'] as const
}

export function useWalletsList() {
	const q = useQuery({
		queryKey: qk.list(),
		queryFn: () => walletsApi.list()
	})

	return {
		wallets: (q.data ?? []) as Wallet[],
		isLoading: q.isLoading,
		reload: q.refetch
	}
}

export function useWalletAdd() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (payload: { chain: Chain; address: string }) => walletsApi.add(payload),
		onSuccess: res => {
			if (!res) {
				notifyError('Failed to add wallet')
				return
			}
			notifySuccess('Wallet added')
			qc.invalidateQueries({ queryKey: qk.list() })
		},
		onError: e => notifyError(e, 'Failed to add wallet')
	})

	return { add: m.mutateAsync, isLoading: m.isPending }
}

export function useWalletDisable() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (walletId: string) => walletsApi.disable(walletId),
		onSuccess: res => {
			if (!res) {
				notifyError('Failed to disable wallet')
				return
			}
			notifySuccess('Wallet disabled')
			qc.invalidateQueries({ queryKey: qk.list() })
		},
		onError: e => notifyError(e, 'Failed to disable wallet')
	})

	return { disable: m.mutateAsync, isLoading: m.isPending }
}

export function useWalletEnable() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (walletId: string) => walletsApi.enable(walletId),
		onSuccess: res => {
			if (!res) {
				notifyError('Failed to enable wallet')
				return
			}
			notifySuccess('Wallet enabled')
			qc.invalidateQueries({ queryKey: qk.list() })
		},
		onError: e => notifyError(e, 'Failed to enable wallet')
	})

	return { enable: m.mutateAsync, isLoading: m.isPending }
}
