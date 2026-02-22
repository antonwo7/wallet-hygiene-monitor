import { ethers, Interface, keccak256, Log, toUtf8Bytes } from 'ethers'

export const APPROVALS_ABI = [
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
	'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
] as const

export const approvalsInterface = new Interface(APPROVALS_ABI)

export function parseLog(log: any) {
	try {
		return approvalsInterface.parseLog(log as any)
	} catch {
		return null
	}
}

export async function getLogs(provider: ethers.JsonRpcProvider, filter: any) {
	try {
		return await provider.getLogs(filter)
	} catch (e: any) {
		return null
	}
}

export function getLogIndex(log: Log) {
	return Number((log as any).index ?? (log as any).logIndex ?? 0)
}

export const APPROVAL_TOPIC = keccak256(toUtf8Bytes('Approval(address,address,uint256)'))
export const APPROVAL_FOR_ALL_TOPIC = keccak256(toUtf8Bytes('ApprovalForAll(address,address,bool)'))
