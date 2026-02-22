const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
	console.warn('NEXT_PUBLIC_API_URL is not set')
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
	try {
		const res = await fetch(`${API_URL}${path}`, {
			...init,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...(init?.headers ?? {})
			}
		})

		if (!res.ok) {
			const text = await res.text().catch(() => '')
			throw new Error(text || `Request failed: ${res.status}`)
		}

		return (await res.json()) as T
	} catch (e: any) {
		return null
	}
}
