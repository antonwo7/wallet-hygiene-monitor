'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: 0,
						refetchOnWindowFocus: false,
						staleTime: 10_000
					},
					mutations: {
						retry: 0
					}
				}
			})
	)

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<Toaster
				position="top-right"
				toastOptions={{
					duration: 4000
				}}
			/>
		</QueryClientProvider>
	)
}
