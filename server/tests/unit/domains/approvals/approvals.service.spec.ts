import { Chain, ApprovalKind, RiskLevel } from '@prisma/client'
import { ApprovalsService } from 'src/domains/approvals/approvals.service'

function makeSvc(overrides?: Partial<{
  repo: any
  env: any
  walletsRepo: any
  allowlist: any
}>) {
  const repo = overrides?.repo ?? {
    findFeed: jest.fn(),
    createOne: jest.fn(),
    findAny: jest.fn(),
    createManyAndFind: jest.fn(),
  }
  const env = overrides?.env ?? {
    valuableTokensEthereum: '',
    valuableTokensPolygon: '',
    valuableTokensArbitrum: '',
  }
  const walletsRepo = overrides?.walletsRepo ?? {
    getUserIdsByWalletIds: jest.fn(),
  }
  const allowlist = overrides?.allowlist ?? {
    getTrustedSet: jest.fn(),
  }

  const svc = new ApprovalsService(repo, env as any, walletsRepo as any, allowlist as any)
  return { svc, repo, env, walletsRepo, allowlist }
}

describe('ApprovalsService.computeRisk', () => {
  it('marks revoke for ERC20 rawValue=0', () => {
    const { svc } = makeSvc()
    const r = (svc as any).computeRisk({
      chain: Chain.ethereum,
      kind: ApprovalKind.ERC20_APPROVAL,
      tokenAddress: '0xToken',
      spender: '0xSpender',
      rawValue: '0',
      txHash: '0x',
      blockNumber: '1',
      logIndex: 0,
      walletId: 'w',
    })

    expect(r.riskScore).toBe(0)
    expect(r.riskLevel).toBe(RiskLevel.LOW)
    expect(r.riskMeta.reasons).toContain('REVOKE')
  })

  it('adds score for valuable token + spender not allowlisted + infinite allowance', () => {
    const { svc } = makeSvc({
      env: {
        valuableTokensEthereum: '0xtoken',
        valuableTokensPolygon: '',
        valuableTokensArbitrum: '',
      },
    })

    const MAX_UINT256 = (1n << 256n) - 1n

    const r = (svc as any).computeRisk(
      {
        chain: Chain.ethereum,
        kind: ApprovalKind.ERC20_APPROVAL,
        tokenAddress: '0xToKeN',
        spender: '0xSpender',
        rawValue: MAX_UINT256.toString(),
        txHash: '0x',
        blockNumber: '1',
        logIndex: 0,
        walletId: 'w',
      },
      { isTrustedSpender: false },
    )

    expect(r.riskScore).toBe(20 + 25 + 60)
    expect(r.riskLevel).toBe(RiskLevel.CRITICAL)
    expect(r.riskMeta.reasons).toEqual(expect.arrayContaining(['VALUABLE_TOKEN', 'SPENDER_NOT_ALLOWLISTED', 'INFINITE_ALLOWANCE']))
    expect(r.riskMeta.isInfinite).toBe(true)
  })

  it('adds score for huge allowance (>= 2^255) but not infinite', () => {
    const { svc } = makeSvc()
    const huge = (1n << 255n).toString()
    const r = (svc as any).computeRisk({
      chain: Chain.ethereum,
      kind: ApprovalKind.ERC20_APPROVAL,
      tokenAddress: '0xToken',
      spender: '0xSpender',
      rawValue: huge,
      txHash: '0x',
      blockNumber: '1',
      logIndex: 0,
      walletId: 'w',
    })

    expect(r.riskScore).toBe(40)
    expect(r.riskLevel).toBe(RiskLevel.MEDIUM)
    expect(r.riskMeta.reasons).toContain('HUGE_ALLOWANCE')
    expect(r.riskMeta.isInfinite).toBe(false)
  })

  it('ApprovalForAll approved=true is high risk; approved=false is revoke', () => {
    const { svc } = makeSvc({
      env: {
        valuableTokensEthereum: '0xaaa',
        valuableTokensPolygon: '',
        valuableTokensArbitrum: '',
      },
    })

    const enabled = (svc as any).computeRisk({
      chain: Chain.ethereum,
      kind: ApprovalKind.APPROVAL_FOR_ALL,
      tokenAddress: '0xaaa',
      spender: '0xoperator',
      approved: true,
      txHash: '0x',
      blockNumber: '1',
      logIndex: 0,
      walletId: 'w',
    })

    expect(enabled.riskScore).toBe(20 + 70)
    expect(enabled.riskLevel).toBe(RiskLevel.CRITICAL)
    expect(enabled.riskMeta.reasons).toEqual(expect.arrayContaining(['VALUABLE_TOKEN', 'APPROVAL_FOR_ALL_ENABLED']))

    const disabled = (svc as any).computeRisk({
      chain: Chain.ethereum,
      kind: ApprovalKind.APPROVAL_FOR_ALL,
      tokenAddress: '0xaaa',
      spender: '0xoperator',
      approved: false,
      txHash: '0x',
      blockNumber: '1',
      logIndex: 0,
      walletId: 'w',
    })

    expect(disabled.riskScore).toBe(0)
    expect(disabled.riskMeta.reasons).toContain('REVOKE')
  })
})

describe('ApprovalsService.createMany (unit)', () => {
  it('deduplicates by chain+txHash+logIndex and passes isTrustedSpender into risk computation', async () => {
    const repo = {
      findAny: jest.fn(),
      createManyAndFind: jest.fn(),
      findFeed: jest.fn(),
      createOne: jest.fn(),
    }
    repo.findAny.mockResolvedValue([
      { chain: Chain.ethereum, txHash: '0x1', logIndex: 1 }, // already exists
    ])

    const walletsRepo = {
      getUserIdsByWalletIds: jest.fn(),
    }
    walletsRepo.getUserIdsByWalletIds.mockResolvedValue(new Map([['w1', 'u1']]))

    const allowlist = {
      getTrustedSet: jest.fn(),
    }
    allowlist.getTrustedSet.mockResolvedValue(new Set(['0xtrusted']))

    // Return whatever is passed to createManyAndFind as "created"
    repo.createManyAndFind.mockImplementation(async (rows: any[]) =>
      rows.map((r, i) => ({ id: String(i), ...r })),
    )

    const { svc } = makeSvc({ repo, walletsRepo, allowlist })

    const input = [
      {
        walletId: 'w1',
        chain: Chain.ethereum,
        kind: ApprovalKind.ERC20_APPROVAL,
        tokenAddress: '0xtoken',
        spender: '0xTrusted',
        rawValue: '1',
        txHash: '0x1',
        blockNumber: '10',
        logIndex: 1,
      },
      {
        walletId: 'w1',
        chain: Chain.ethereum,
        kind: ApprovalKind.ERC20_APPROVAL,
        tokenAddress: '0xtoken',
        spender: '0xTrusted',
        rawValue: '1',
        txHash: '0x2',
        blockNumber: '11',
        logIndex: 2,
      },
      {
        walletId: 'w1',
        chain: Chain.ethereum,
        kind: ApprovalKind.ERC20_APPROVAL,
        tokenAddress: '0xtoken',
        spender: '0xNotTrusted',
        rawValue: '1',
        txHash: '0x3',
        blockNumber: '12',
        logIndex: 3,
      },
    ]

    const created = await svc.createMany(input as any)

    // one event was already in DB -> should create 2
    expect(repo.createManyAndFind).toHaveBeenCalledTimes(1)
    const rowsPassed = repo.createManyAndFind.mock.calls[0][0]
    expect(rowsPassed).toHaveLength(2)

    // allowlist asked once per (userId, chain) group with unique spenders
    expect(allowlist.getTrustedSet).toHaveBeenCalledWith('u1', Chain.ethereum, ['0xtrusted', '0xnottrusted'])

    const trustedRow = rowsPassed.find((r: any) => r.txHash === '0x2')
    const notTrustedRow = rowsPassed.find((r: any) => r.txHash === '0x3')

    expect(trustedRow.riskMeta.reasons).not.toContain('SPENDER_NOT_ALLOWLISTED')
    expect(notTrustedRow.riskMeta.reasons).toContain('SPENDER_NOT_ALLOWLISTED')

    expect(created).toHaveLength(2)
  })
})
