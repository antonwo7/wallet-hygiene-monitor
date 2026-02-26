const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
	console.warn('NEXT_PUBLIC_API_URL is not set')
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function readCookie(name: string): string | null {
	if (typeof document === 'undefined') return null
	const m = document.cookie.match(
		new RegExp(`(?:^|; )${name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}=([^;]*)`)
	)
	return m ? decodeURIComponent(m[1]) : null
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
	try {
		const method = (init.method ?? 'GET').toUpperCase()

		const headers = new Headers(init.headers ?? {})
		if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
			headers.set('Content-Type', 'application/json')
		}

		if (!SAFE_METHODS.has(method)) {
			const csrf = readCookie('csrf_token')
			if (csrf) headers.set('x-csrf-token', csrf)
		}

		const res = await fetch(`${API_URL}${path}`, {
			...init,
			method,
			credentials: 'include',
			headers
		})

		if (!res.ok) {
			const text = await res.text().catch(() => '')
			throw new Error(text || `Request failed: ${res.status}`)
		}

		const ct = res.headers.get('content-type') || ''
		if (!ct.includes('application/json')) return null

		return (await res.json()) as T
	} catch {
		return null
	}
}
