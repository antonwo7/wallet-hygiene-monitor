export type Chain = 'ethereum' | 'polygon' | 'arbitrum'

export type WalletStatus = 'ACTIVE' | 'DISABLED'
export type BackfillStatus = 'pending' | 'running' | 'done' | 'error'

export type WalletState = {
  id: string
  walletId: string
  lastScannedBlock: string | number | bigint | null
  backfillStatus: BackfillStatus
  backfillStartedAt: string | null
  backfillFinishedAt: string | null
  backfillError: string | null
}

export type Wallet = {
  id: string
  userId: string
  chain: Chain
  address: string
  status: WalletStatus
  createdAt: string
  state?: WalletState | null
}

export type ApprovalKind = 'ERC20_APPROVAL' | 'APPROVAL_FOR_ALL'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ApprovalEventFeedItem = {
  id: string
  walletId: string
  chain: Chain
  kind: ApprovalKind
  tokenAddress: string
  spender: string
  rawValue: string | null
  approved: boolean | null
  txHash: string
  blockNumber: string | number
  logIndex: number
  riskScore: number
  riskLevel: RiskLevel
  riskMeta: any
  createdAt: string
  wallet?: { id: string; chain: Chain; address: string }
}

export type TrustedSpender = {
  userId: string
  chain: Chain
  spender: string
  label: string | null
  createdAt: string
}
