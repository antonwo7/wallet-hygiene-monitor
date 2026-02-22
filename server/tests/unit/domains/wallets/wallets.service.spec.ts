import { WalletStatus, Chain } from '@prisma/client'

// IMPORTANT: jest.mock is hoisted. Define the mock fully inside the factory.
jest.mock('ethers', () => {
  const getBlockNumber = jest.fn()
  const JsonRpcProvider = jest.fn().mockImplementation(() => ({ getBlockNumber }))
  return {
    ethers: { JsonRpcProvider },
    __mock: { getBlockNumber, JsonRpcProvider },
  }
})

// Import AFTER mocking ethers (otherwise WalletsService will capture the real module).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WalletsService } = require('src/domains/wallets/services/wallets.service') as {
  WalletsService: new (...args: any[]) => any
}
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mock } = require('ethers') as { __mock: { getBlockNumber: jest.Mock; JsonRpcProvider: jest.Mock } }

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WalletNotFoundError } = require('src/domains/wallets/wallets.errors') as {
  WalletNotFoundError: new (...args: any[]) => Error
}

describe('WalletsService', () => {
  const walletsRepository = {
    findManyByUser: jest.fn(),
    createWithState: jest.fn(),
    findByIdForUser: jest.fn(),
    setStatus: jest.fn(),
  }
  const walletStateRepository = {
    updateByWalletId: jest.fn(),
  }
  const env = {
    rpcUrl: jest.fn(),
    scannerConfirmations: jest.fn(),
    backfillDays: jest.fn(),
    avgBlockTimeSeconds: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    __mock.getBlockNumber.mockReset()
    __mock.JsonRpcProvider.mockClear()
  })

  it('add creates wallet and configures start block based on confirmations + backfill days', async () => {
    walletsRepository.createWithState.mockResolvedValue({ id: 'w1', address: '0xabc', chain: Chain.ethereum })

    env.rpcUrl.mockReturnValue('https://rpc')
    env.scannerConfirmations.mockReturnValue(10)
    env.backfillDays.mockReturnValue(0.01)
    env.avgBlockTimeSeconds.mockReturnValue(10)

    __mock.getBlockNumber.mockResolvedValue(1000)

    const svc = new WalletsService(walletsRepository as any, walletStateRepository as any, env as any)

    const res = await svc.add('u1', { address: '0xAbC', chain: Chain.ethereum } as any)

    expect(walletsRepository.createWithState).toHaveBeenCalledWith({
      userId: 'u1',
      chain: Chain.ethereum,
      address: '0xabc',
    })

    // safeLatest = 1000 - 10 = 990
    // blocksBack = floor((0.01*86400)/10) = 86
    // startBlock = 990-86 = 904
    expect(walletStateRepository.updateByWalletId).toHaveBeenCalledWith(
      'w1',
      expect.objectContaining({ lastScannedBlock: 904n })
    )

    expect(res.id).toBe('w1')
  })

  it('add caches provider per chain (JsonRpcProvider constructed once)', async () => {
    walletsRepository.createWithState
      .mockResolvedValueOnce({ id: 'w1' })
      .mockResolvedValueOnce({ id: 'w2' })

    env.rpcUrl.mockReturnValue('https://rpc')
    env.scannerConfirmations.mockReturnValue(0)
    env.backfillDays.mockReturnValue(0)
    env.avgBlockTimeSeconds.mockReturnValue(12)
    __mock.getBlockNumber.mockResolvedValue(1)

    const svc = new WalletsService(walletsRepository as any, walletStateRepository as any, env as any)

    await svc.add('u1', { address: '0xabc', chain: Chain.ethereum } as any)
    await svc.add('u1', { address: '0xdef', chain: Chain.ethereum } as any)

    expect(__mock.JsonRpcProvider).toHaveBeenCalledTimes(1)
  })

  it('disable throws WalletNotFoundError when wallet missing', async () => {
    walletsRepository.findByIdForUser.mockResolvedValue(null)

    const svc = new WalletsService(walletsRepository as any, walletStateRepository as any, env as any)

    await expect(svc.disable('u1', 'w1')).rejects.toBeInstanceOf(WalletNotFoundError)
  })

  it('enable/disable set status when wallet exists', async () => {
    walletsRepository.findByIdForUser.mockResolvedValue({ id: 'w1' })

    const svc = new WalletsService(walletsRepository as any, walletStateRepository as any, env as any)

    await svc.disable('u1', 'w1')
    expect(walletsRepository.setStatus).toHaveBeenCalledWith('w1', 'u1', WalletStatus.DISABLED)

    await svc.enable('u1', 'w1')
    expect(walletsRepository.setStatus).toHaveBeenCalledWith('w1', 'u1', WalletStatus.ACTIVE)
  })
})
