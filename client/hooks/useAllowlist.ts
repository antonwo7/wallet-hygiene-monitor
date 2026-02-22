import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { allowlistApi } from '../lib/api'
import type { Chain, TrustedSpender } from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'

const qk = {
	list: (chain?: Chain) => ['allowlist', chain ?? 'all'] as const
}

export function useAllowlistList(chain?: Chain) {
	const q = useQuery({
		queryKey: qk.list(chain),
		queryFn: () => allowlistApi.list(chain)
	})

	return {
		items: (q.data ?? []) as TrustedSpender[],
		isLoading: q.isLoading,
		reload: q.refetch
	}
}

export function useAllowlistAdd() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (payload: { chain: Chain; spender: string; label?: string }) => allowlistApi.add(payload),
		onSuccess: (res, vars) => {
			if (!res) {
				notifyError('Failed to add to allowlist')
				return
			}
			notifySuccess('Added to allowlist')
			qc.invalidateQueries({ queryKey: qk.list(vars.chain) })
			qc.invalidateQueries({ queryKey: qk.list(undefined) })
		},
		onError: e => notifyError(e, 'Failed to add to allowlist')
	})

	return { add: m.mutateAsync, isLoading: m.isPending }
}

export function useAllowlistRemove() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (vars: { chain: Chain; spender: string }) => allowlistApi.remove(vars.chain, vars.spender),
		onSuccess: (res, vars) => {
			if (!res) {
				notifyError('Failed to remove from allowlist')
				return
			}
			notifySuccess('Removed from allowlist')
			qc.invalidateQueries({ queryKey: qk.list(vars.chain) })
			qc.invalidateQueries({ queryKey: qk.list(undefined) })
		},
		onError: e => notifyError(e, 'Failed to remove from allowlist')
	})

	return {
		remove: (chain: Chain, spender: string) => m.mutateAsync({ chain, spender }),
		isLoading: m.isPending
	}
}
