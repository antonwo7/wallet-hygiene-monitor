import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../lib/api'
import { notifyError, notifySuccess } from '../lib/notify'

const qk = {
	me: () => ['auth', 'me'] as const
}

export function useLogin() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (payload: { identifier: string; password: string }) => authApi.login(payload),
		onSuccess: res => {
			if (!res) {
				notifyError('Login failed')
				return
			}
			notifySuccess('Signed in')
			qc.setQueryData(qk.me(), res)
			qc.invalidateQueries({ queryKey: qk.me() })
		},
		onError: e => notifyError(e, 'Login failed')
	})
	return { login: m.mutateAsync, isLoading: m.isPending }
}

export function useRegister() {
	const qc = useQueryClient()
	const m = useMutation({
		mutationFn: (payload: {
			nickname: string
			email: string
			firstName: string
			lastName: string
			password: string
		}) => authApi.register(payload),
		onSuccess: res => {
			if (!res) {
				notifyError('Registration failed')
				return
			}
			notifySuccess('Account created')
			qc.setQueryData(qk.me(), res)
			qc.invalidateQueries({ queryKey: qk.me() })
		},
		onError: e => notifyError(e, 'Registration failed')
	})
	return { register: m.mutateAsync, isLoading: m.isPending }
}
