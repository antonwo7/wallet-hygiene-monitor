import { useCallback, useEffect, useRef, useState } from 'react'
import { notifyError } from '../lib/notify'

export function useAsync<TArgs extends any[], TResult>(
	action: (...args: TArgs) => Promise<TResult>,
	options?: {
		errorMessage?: string
	}
) {
	const [isLoading, setIsLoading] = useState(false)
	const mountedRef = useRef(true)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	const run = useCallback(
		async (...args: TArgs) => {
			setIsLoading(true)
			try {
				return await action(...args)
			} catch (e) {
				notifyError(e, options?.errorMessage)
				return undefined as any
			} finally {
				if (mountedRef.current) setIsLoading(false)
			}
		},
		[action, options?.errorMessage]
	)

	return { run, isLoading }
}
