import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../lib/api'
import type { User } from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'

const qk = {
	me: () => ['auth', 'me'] as const
}

export function useMe() {
	const q = useQuery({
		queryKey: qk.me(),
		queryFn: () => authApi.me(),
		retry: 0,
		staleTime: 30_000
	})

	const user = (q.data as any)?.user as User | undefined

	return {
		user: user ?? null,
		isLoading: q.isLoading,
		reload: q.refetch
	}
}

export function useLogout() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: () => authApi.logout(),
		onSuccess: res => {
			if (!res) {
				notifyError('Failed to logout')
				return
			}
			notifySuccess('Signed out')
			qc.setQueryData(qk.me(), null)
			qc.invalidateQueries({ queryKey: qk.me() })
		},
		onError: e => notifyError(e, 'Failed to logout')
	})

	return { logout: m.mutateAsync, isLoading: m.isPending }
}
