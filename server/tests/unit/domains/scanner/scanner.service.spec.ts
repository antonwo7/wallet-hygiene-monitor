import { ScannerService } from 'src/domains/scanner/scanner.service'
import { Chain } from '@prisma/client'

describe('ScannerService.scanTick (unit)', () => {
  it('groups active wallets by chain and calls scanChain for each chain', async () => {
    const repo = {
      getActiveWallets: jest.fn(),
      updateLastScannedBlock: jest.fn(),
    }
    const env: any = {}
    const approvals: any = {}
    const mail: any = {}

    repo.getActiveWallets.mockResolvedValue([
      { id: 'w1', chain: Chain.ethereum },
      { id: 'w2', chain: Chain.polygon },
      { id: 'w3', chain: Chain.ethereum },
    ])

    const svc = new ScannerService(repo as any, env, approvals, mail)

    const spy = jest.spyOn(svc as any, 'scanChain').mockResolvedValue(undefined)

    await svc.scanTick()

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith(Chain.ethereum, expect.any(Array))
    expect(spy).toHaveBeenCalledWith(Chain.polygon, expect.any(Array))

    const ethArg = (spy.mock.calls.find(c => c[0] === Chain.ethereum)![1] as any[])
    expect(ethArg.map((w: any) => w.id).sort()).toEqual(['w1', 'w3'])
  })

  it('does nothing when no active wallets', async () => {
    const repo = { getActiveWallets: jest.fn().mockResolvedValue([]) }
    const svc = new ScannerService(repo as any, {} as any, {} as any, {} as any)

    const spy = jest.spyOn(svc as any, 'scanChain')
    await svc.scanTick()
    expect(spy).not.toHaveBeenCalled()
  })
})
