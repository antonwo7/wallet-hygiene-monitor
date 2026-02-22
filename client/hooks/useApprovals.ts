import { useQuery } from '@tanstack/react-query'
import { approvalsApi } from '../lib/api'
import type { ApprovalKind, Chain, ApprovalEventFeedItem } from '../lib/api'

export type ApprovalsQuery = {
	chain?: Chain
	kind?: ApprovalKind
	minRisk?: number
	skip?: number
	take?: number
}

const qk = {
	feed: (q: ApprovalsQuery) => ['approvals', q] as const
}

export function useApprovalsList(query: ApprovalsQuery) {
	const q = useQuery({
		queryKey: qk.feed(query),
		queryFn: () => approvalsApi.feed(query),
		placeholderData: prev => prev
	})

	return {
		items: (q.data ?? []) as ApprovalEventFeedItem[],
		isLoading: q.isLoading,
		reload: q.refetch
	}
}
