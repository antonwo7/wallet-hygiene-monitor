import { apiFetch } from '../lib/apiFetch'

export type User = {
	id: string
	nickname: string
	email: string
	firstName: string
	lastName: string
}

export type UserSettings = {
	id: string
	email: string
	emailNotificationsEnabled: boolean
	emailMinRiskScore: number
}

export const authApi = {
	me: () => apiFetch<{ user: User }>('/auth/me'),

	login: (payload: { identifier: string; password: string }) =>
		apiFetch<{ user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

	register: (payload: {
		nickname: string
		email: string
		firstName: string
		lastName: string
		password: string
	}) => apiFetch<{ user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

	logout: () => apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' }),

	requestReset: (payload: { email: string }) =>
		apiFetch<{ ok: true }>('/auth/password/request', { method: 'POST', body: JSON.stringify(payload) }),

	resetPassword: (payload: { token: string; password: string; passwordConfirm: string }) =>
		apiFetch<{ ok: true }>('/auth/password/reset', { method: 'POST', body: JSON.stringify(payload) }),

	getUserSettings: () => apiFetch<{ settings: UserSettings }>('/users/settings'),

	updateUserSettings: (payload: { emailNotificationsEnabled?: boolean; emailMinRiskScore?: number }) =>
		apiFetch<{ settings: UserSettings }>('/users/settings', {
			method: 'PATCH',
			body: JSON.stringify(payload)
		})
}
