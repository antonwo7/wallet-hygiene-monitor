import { UsersService } from 'src/domains/users/users.service'
import { EmailAlreadyRegisteredError, NicknameAlreadyTakenError } from 'src/domains/users/users.errors'
import { AppError } from 'src/shared/errors/app-error'

describe('UsersService', () => {
  const repo = {
    findByEmail: jest.fn(),
    findByNickname: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    getUserSettings: jest.fn(),
    updateUserSettings: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ensureUnique throws NicknameAlreadyTakenError', async () => {
    repo.findByNickname.mockResolvedValue({ id: 'x' })
    repo.findByEmail.mockResolvedValue(null)

    const svc = new UsersService(repo as any)
    await expect(svc.ensureUnique('nick', 'e@mail.com')).rejects.toBeInstanceOf(NicknameAlreadyTakenError)
  })

  it('ensureUnique throws EmailAlreadyRegisteredError', async () => {
    repo.findByNickname.mockResolvedValue(null)
    repo.findByEmail.mockResolvedValue({ id: 'x' })

    const svc = new UsersService(repo as any)
    await expect(svc.ensureUnique('nick', 'e@mail.com')).rejects.toBeInstanceOf(EmailAlreadyRegisteredError)
  })

  it('createUser calls ensureUnique then repo.create', async () => {
    repo.findByNickname.mockResolvedValue(null)
    repo.findByEmail.mockResolvedValue(null)
    repo.create.mockResolvedValue({ id: 'u1' })

    const svc = new UsersService(repo as any)
    const res = await svc.createUser({
      nickname: 'nick',
      email: 'e@mail.com',
      firstName: 'A',
      lastName: 'B',
      passwordHash: 'hash',
    })

    expect(repo.create).toHaveBeenCalledWith({
      nickname: 'nick',
      email: 'e@mail.com',
      firstName: 'A',
      lastName: 'B',
      passwordHash: 'hash',
    })
    expect(res).toEqual({ id: 'u1' })
  })

  it('getUser throws AppError USER_NOT_FOUND when user missing', async () => {
    repo.findById.mockResolvedValue(null)

    const svc = new UsersService(repo as any)
    await expect(svc.getUser('missing')).rejects.toBeInstanceOf(AppError)

    try {
      await svc.getUser('missing')
    } catch (e: any) {
      expect(e.code).toBe('USER_NOT_FOUND')
      expect(e.httpStatus).toBe(404)
    }
  })

  it('getUser returns safe subset', async () => {
    repo.findById.mockResolvedValue({
      id: 'u1',
      nickname: 'nick',
      email: 'e@mail.com',
      firstName: 'A',
      lastName: 'B',
      passwordHash: 'SECRET',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      emailNotificationsEnabled: true,
      emailMinRiskScore: 50,
    })

    const svc = new UsersService(repo as any)
    const res = await svc.getUser('u1')

    expect(res).toEqual({
      id: 'u1',
      nickname: 'nick',
      email: 'e@mail.com',
      firstName: 'A',
      lastName: 'B',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
      emailNotificationsEnabled: true,
      emailMinRiskScore: 50,
    })
    expect((res as any).passwordHash).toBeUndefined()
  })
})
