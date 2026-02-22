import {
	approvalsInterface,
	parseLog,
	getLogIndex,
	APPROVAL_TOPIC,
	APPROVAL_FOR_ALL_TOPIC
} from '../../../../src/shared/evm/approvals.events'

describe('approvals.events', () => {
	it('getLogIndex prefers index then logIndex then 0', () => {
		expect(getLogIndex({ index: 7 } as any)).toBe(7)
		expect(getLogIndex({ logIndex: 9 } as any)).toBe(9)
		expect(getLogIndex({} as any)).toBe(0)
	})

	it('parseLog returns null on invalid log', () => {
		expect(parseLog({})).toBeNull()
	})

	it('parseLog parses Approval event', () => {
		const owner = '0x0000000000000000000000000000000000000001'
		const spender = '0x0000000000000000000000000000000000000002'
		const value = 123n

		const fragment = approvalsInterface.getEvent('Approval')
		expect(fragment).not.toBeNull()
		const { data, topics } = approvalsInterface.encodeEventLog(fragment!, [owner, spender, value])

		const log = {
			address: '0x00000000000000000000000000000000000000aa',
			data,
			topics
		}

		const parsed = parseLog(log as any)
		expect(parsed).not.toBeNull()
		expect(parsed!.name).toBe('Approval')
		expect(String((parsed!.args as any).owner).toLowerCase()).toBe(owner)
		expect(String((parsed!.args as any).spender).toLowerCase()).toBe(spender)
		expect(BigInt((parsed!.args as any).value)).toBe(value)
	})

	it('topics constants look like keccak256 hashes', () => {
		// basic sanity: 0x + 64 hex chars
		expect(APPROVAL_TOPIC).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(APPROVAL_FOR_ALL_TOPIC).toMatch(/^0x[0-9a-fA-F]{64}$/)
		expect(APPROVAL_TOPIC).not.toBe(APPROVAL_FOR_ALL_TOPIC)
	})
})
