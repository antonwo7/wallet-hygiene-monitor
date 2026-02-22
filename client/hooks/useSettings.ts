import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'

const qk = {
	settings: () => ['me', 'settings'] as const,
	me: () => ['auth', 'me'] as const
}

export function useUserSettings() {
	const q = useQuery({
		queryKey: qk.settings(),
		queryFn: () => authApi.getUserSettings(),
		retry: 0,
		staleTime: 30_000
	})

	const settings = (q.data as any)?.settings ?? null

	return {
		settings,
		isLoading: q.isLoading,
		reload: q.refetch
	}
}

export function useUpdateUserSettings() {
	const qc = useQueryClient()

	const m = useMutation({
		mutationFn: (payload: { emailNotificationsEnabled?: boolean; emailMinRiskScore?: number }) =>
			authApi.updateUserSettings(payload),
		onSuccess: (res: any) => {
			if (!res?.settings) {
				notifyError('Failed to update settings')
				return
			}
			notifySuccess('Settings saved')
			qc.invalidateQueries({ queryKey: qk.settings() })
			qc.invalidateQueries({ queryKey: qk.me() })
		},
		onError: e => notifyError(e, 'Failed to update settings')
	})

	return { update: m.mutateAsync, isLoading: m.isPending }
}
