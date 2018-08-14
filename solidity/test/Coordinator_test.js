'use strict'

require('./support/helpers.js')

contract('Coordinator', () => {
  const sourcePath = 'Coordinator.sol'
  let coordinator

  beforeEach(async () => {
    coordinator = await deploy(sourcePath)
  })

  it('has a limited public interface', () => {
    checkPublicABI(artifacts.require(sourcePath), [
      'getId',
      'initiateServiceAgreement',
      'getServiceAgreement'
    ])
  })

  describe('#getId', () => {
    it('matches the ID generated by the oracle off-chain', async () => {
      let result = await coordinator.getId.call(1, 2, '0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd')
      assert.equal(result, '0x220072871b41155e7e1a6c45246a6d18a8a25350917d2c6c6c49d5d79a6af5bf')
    })
  })

  describe('initiate a ServiceAgreement & return it', () => {
    it('returns a previously saved agreement in abi encoding', async () => {
      await coordinator.initiateServiceAgreement(
        1,
        2,
        '0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd'
      )

      let sa = await coordinator.getServiceAgreement.call(
        '0x220072871b41155e7e1a6c45246a6d18a8a25350917d2c6c6c49d5d79a6af5bf'
      )
      assert.equal(
        sa,
        '0x0000000000000000000000000000000000000000000000000000000000000001' +
        '0000000000000000000000000000000000000000000000000000000000000002' +
        '85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd'
      )
    })

    it('returns 0 encoded hex value when it does not exist', async () => {
      let sa = await coordinator.getServiceAgreement.call('0x220072871b41155e7e1a6c45246a6d18a8a25350917d2c6c6c49d5d79a6af5bf')

      assert.equal(
        sa,
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      )
    })
  })
})
