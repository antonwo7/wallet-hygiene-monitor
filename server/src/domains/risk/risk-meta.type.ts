export type RiskReasonCode =
	| 'INFINITE_ALLOWANCE'
	| 'HUGE_ALLOWANCE'
	| 'APPROVAL_FOR_ALL_ENABLED'
	| 'SPENDER_NOT_ALLOWLISTED'
	| 'VALUABLE_TOKEN'
	| 'INFINITE_TO_UNKNOWN_SPENDER'
	| 'NFT_OPERATOR_UNKNOWN'
	| 'REVOKE'

export type RiskMeta = {
	reasons?: RiskReasonCode[]
	isInfinite?: boolean
	spenderAllowlisted?: boolean
	token?: { symbol?: string; decimals?: number }
	normalizedValue?: string
	details?: Record<string, any>
}
