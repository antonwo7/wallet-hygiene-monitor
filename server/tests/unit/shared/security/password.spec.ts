import { hashPassword, verifyPassword } from '../../../../src/shared/security/password'

describe('password helpers (argon2)', () => {
	it('hashPassword + verifyPassword works', async () => {
		const hash = await hashPassword('secret')
		expect(typeof hash).toBe('string')
		expect(hash.length).toBeGreaterThan(10)

		await expect(verifyPassword(hash, 'secret')).resolves.toBe(true)
		await expect(verifyPassword(hash, 'wrong')).resolves.toBe(false)
	})
})
