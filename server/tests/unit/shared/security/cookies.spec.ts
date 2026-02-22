import {
	ACCESS_COOKIE,
	REFRESH_COOKIE,
	clearAuthCookies,
	setAuthCookies
} from '../../../../src/shared/security/cookies'

describe('cookies helpers', () => {
	it('setAuthCookies sets both cookies with httpOnly + base options', () => {
		const res: any = { cookie: jest.fn() }

		setAuthCookies(
			res,
			{ accessToken: 'a', refreshToken: 'r' },
			{ domain: 'example.com', secure: true, sameSite: 'strict' }
		)

		expect(res.cookie).toHaveBeenCalledTimes(2)

		expect(res.cookie).toHaveBeenCalledWith(
			ACCESS_COOKIE,
			'a',
			expect.objectContaining({
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				domain: 'example.com',
				path: '/'
			})
		)

		expect(res.cookie).toHaveBeenCalledWith(
			REFRESH_COOKIE,
			'r',
			expect.objectContaining({
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				domain: 'example.com',
				path: '/'
			})
		)
	})

	it('clearAuthCookies clears both cookies with same options', () => {
		const res: any = { clearCookie: jest.fn() }

		clearAuthCookies(res, { domain: 'example.com', secure: false })

		expect(res.clearCookie).toHaveBeenCalledTimes(2)
		expect(res.clearCookie).toHaveBeenCalledWith(
			ACCESS_COOKIE,
			expect.objectContaining({
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: 'example.com',
				path: '/'
			})
		)
		expect(res.clearCookie).toHaveBeenCalledWith(
			REFRESH_COOKIE,
			expect.objectContaining({
				httpOnly: true,
				secure: false,
				sameSite: 'lax',
				domain: 'example.com',
				path: '/'
			})
		)
	})
})
