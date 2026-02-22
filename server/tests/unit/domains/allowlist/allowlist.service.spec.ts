import { AllowlistService } from 'src/domains/allowlist/allowlist.service'
import { Chain } from '@prisma/client'

describe('AllowlistService', () => {
  const repo = {
    findTrusted: jest.fn(),
    list: jest.fn(),
    upsertOne: jest.fn(),
    deleteOne: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('getTrustedSet normalizes spenders (lowercase, unique, filters empty) and delegates to repo', async () => {
    repo.findTrusted.mockResolvedValue(new Set(['0xabc']))
    const svc = new AllowlistService(repo as any)

    const out = await svc.getTrustedSet('u1', Chain.ethereum, ['0xAbC', '0xabc', '', '  ', '0xDEF'])

    // service lowercases + unique + filters only falsy values (whitespace strings stay)
    expect(repo.findTrusted).toHaveBeenCalledWith('u1', Chain.ethereum, ['0xabc', '  ', '0xdef'])
    expect(out).toEqual(new Set(['0xabc']))
  })

  it('add lowercases spender and calls upsertOne', async () => {
    repo.upsertOne.mockResolvedValue({ ok: true })
    const svc = new AllowlistService(repo as any)

    await svc.add('u1', { chain: Chain.polygon, spender: '0xAbC', label: 'Uniswap' })

    expect(repo.upsertOne).toHaveBeenCalledWith({
      userId: 'u1',
      chain: Chain.polygon,
      spender: '0xabc',
      label: 'Uniswap',
    })
  })

  it('remove lowercases spender and returns deleted count wrapper', async () => {
    repo.deleteOne.mockResolvedValue(3)
    const svc = new AllowlistService(repo as any)

    const res = await svc.remove('u1', { chain: Chain.arbitrum, spender: '0xAbC' })
    expect(repo.deleteOne).toHaveBeenCalledWith({ userId: 'u1', chain: Chain.arbitrum, spender: '0xabc' })
    expect(res).toEqual({ deleted: 3 })
  })
})
