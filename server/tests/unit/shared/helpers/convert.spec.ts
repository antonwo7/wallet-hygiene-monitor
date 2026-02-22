import { stringBigInt } from '../../../../src/shared/helpers/convert'

describe('stringBigInt', () => {
	it('returns null for undefined / empty', () => {
		expect(stringBigInt(undefined)).toBeNull()
		expect(stringBigInt('')).toBeNull()
		// JS BigInt() accepts whitespace-only strings and treats them as 0
		expect(stringBigInt('   ')).toBe(0n)
	})

	it('parses valid bigint strings', () => {
		expect(stringBigInt('0')).toBe(0n)
		expect(stringBigInt('123')).toBe(123n)
		expect(
			stringBigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935')
		).toBe(115792089237316195423570985008687907853269984665640564039457584007913129639935n)
	})

	it('returns null for invalid bigint strings', () => {
		expect(stringBigInt('not-a-number')).toBeNull()
		expect(stringBigInt('1.23')).toBeNull()
	})
})
