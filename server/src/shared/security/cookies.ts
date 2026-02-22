import type { Response } from 'express'

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'

export type CookieOptionsInput = {
  domain?: string
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  opts: CookieOptionsInput,
) {
  const base = {
    httpOnly: true,
    secure: Boolean(opts.secure),
    sameSite: opts.sameSite ?? 'lax',
    domain: opts.domain,
    path: '/',
  } as const

  res.cookie(ACCESS_COOKIE, tokens.accessToken, base)
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, base)
}

export function clearAuthCookies(res: Response, opts: CookieOptionsInput) {
  const base = {
    httpOnly: true,
    secure: Boolean(opts.secure),
    sameSite: opts.sameSite ?? 'lax',
    domain: opts.domain,
    path: '/',
  } as const

  res.clearCookie(ACCESS_COOKIE, base)
  res.clearCookie(REFRESH_COOKIE, base)
}
