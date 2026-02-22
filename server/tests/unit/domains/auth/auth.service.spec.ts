import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from 'src/domains/auth/auth.service'
import { ValidationError } from 'src/shared/errors/domain-errors'

jest.mock('src/shared/security/password', () => ({
  hashPassword: jest.fn(async (p: string) => `hash(${p})`),
  verifyPassword: jest.fn(async (hash: string, p: string) => hash === `hash(${p})`),
}))

jest.mock('nanoid', () => ({
  nanoid: () => 'RANDOMTOKEN',
}))

describe('AuthService', () => {
  const users = {
    createUser: jest.fn(),
    findByEmail: jest.fn(),
    findByNickname: jest.fn(),
    getUser: jest.fn(),
  }
  const repo = {
    createPasswordResetToken: jest.fn(),
    findActivePasswordResetCandidates: jest.fn(),
    resetPasswordTransaction: jest.fn(),
  }
  const jwt = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  }
  const jwtConfig = {
    accessSecret: 'A',
    refreshSecret: 'R',
    accessExpiresIn: '15m',
    refreshExpiresIn: '30d',
  }
  const appConfig = {
    appUrl: 'https://app.test',
  }
  const mail = {
    sendRegistrationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('issueTokens signs access + refresh with correct secrets', async () => {
    jwt.signAsync
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('refresh')

    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    const out = await svc.issueTokens('u1')
    expect(out).toEqual({ accessToken: 'access', refreshToken: 'refresh' })

    expect(jwt.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: 'u1' },
      expect.objectContaining({ secret: 'A', expiresIn: '15m' }),
    )
    expect(jwt.signAsync).toHaveBeenNthCalledWith(
      2,
      { sub: 'u1' },
      expect.objectContaining({ secret: 'R', expiresIn: '30d' }),
    )
  })

  it('register creates user, sends email, returns tokens', async () => {
    users.createUser.mockResolvedValue({ id: 'u1', email: 'e@mail.com', firstName: 'A', lastName: 'B', nickname: 'nick' })
    jwt.signAsync.mockResolvedValueOnce('access').mockResolvedValueOnce('refresh')

    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    const res = await svc.register({ nickname: 'nick', email: 'e@mail.com', firstName: 'A', lastName: 'B', password: 'p' })

    expect(users.createUser).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hash(p)' }))
    expect(mail.sendRegistrationEmail).toHaveBeenCalledWith('e@mail.com', expect.any(Object))
    expect(res.tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh' })
  })

  it('login accepts email identifier and validates password', async () => {
    users.findByEmail.mockResolvedValue({ id: 'u1', passwordHash: 'hash(secret)' })
    jwt.signAsync.mockResolvedValueOnce('a').mockResolvedValueOnce('r')

    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    const res = await svc.login({ identifier: ' user@mail.com ', password: 'secret' })
    expect(users.findByEmail).toHaveBeenCalledWith('user@mail.com')
    expect(res.tokens).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('login accepts nickname identifier', async () => {
    users.findByNickname.mockResolvedValue({ id: 'u1', passwordHash: 'hash(secret)' })
    jwt.signAsync.mockResolvedValueOnce('a').mockResolvedValueOnce('r')

    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    await svc.login({ identifier: 'nick', password: 'secret' })
    expect(users.findByNickname).toHaveBeenCalledWith('nick')
  })

  it('login throws Unauthorized on missing user or wrong password', async () => {
    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    users.findByEmail.mockResolvedValue(null)
    await expect(svc.login({ identifier: 'a@b.com', password: 'x' })).rejects.toBeInstanceOf(UnauthorizedException)

    users.findByEmail.mockResolvedValue({ id: 'u1', passwordHash: 'hash(secret)' })
    await expect(svc.login({ identifier: 'a@b.com', password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('requestPasswordReset does nothing if user not found', async () => {
    users.findByEmail.mockResolvedValue(null)
    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    await svc.requestPasswordReset('missing@mail.com')
    expect(repo.createPasswordResetToken).not.toHaveBeenCalled()
    expect(mail.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('requestPasswordReset creates token and sends email', async () => {
    users.findByEmail.mockResolvedValue({ id: 'u1', email: 'e@mail.com' })
    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    const now = Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(now)

    await svc.requestPasswordReset('e@mail.com')

    expect(repo.createPasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', tokenHash: 'hash(RANDOMTOKEN)', expiresAt: expect.any(Date) }),
    )

    expect(mail.sendPasswordResetEmail).toHaveBeenCalledWith(
      'e@mail.com',
      expect.objectContaining({ resetUrl: 'https://app.test/reset-password/RANDOMTOKEN' }),
    )
  })

  it('resetPassword validates passwordConfirm and token match', async () => {
    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    await expect(svc.resetPassword('t', 'a', 'b')).rejects.toBeInstanceOf(ValidationError)

    repo.findActivePasswordResetCandidates.mockResolvedValue([
      { id: 't1', userId: 'u1', tokenHash: 'hash(RANDOMTOKEN)' },
    ])

    await svc.resetPassword('RANDOMTOKEN', 'new', 'new')

    expect(repo.resetPasswordTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', newPasswordHash: 'hash(new)', tokenId: 't1' }),
    )
  })

  it('resetPassword rejects invalid token', async () => {
    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    repo.findActivePasswordResetCandidates.mockResolvedValue([
      { id: 't1', userId: 'u1', tokenHash: 'hash(OTHER)' },
    ])

    await expect(svc.resetPassword('RANDOMTOKEN', 'new', 'new')).rejects.toBeInstanceOf(ValidationError)
  })

  it('verifyAccessToken/verifyRefreshToken uses correct secrets', () => {
    jwt.verify.mockReturnValue({ sub: 'u1' })

    const svc = new AuthService(users as any, repo as any, jwt as any, jwtConfig as any, appConfig as any, mail as any)

    svc.verifyAccessToken('a')
    expect(jwt.verify).toHaveBeenCalledWith('a', { secret: 'A' })

    svc.verifyRefreshToken('r')
    expect(jwt.verify).toHaveBeenCalledWith('r', { secret: 'R' })
  })
})
