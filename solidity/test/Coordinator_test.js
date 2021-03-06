import {
  assertActionThrows,
  bigNum,
  calculateSAID,
  consumer,
  checkPublicABI,
  deploy,
  executeServiceAgreementBytes,
  functionSelector,
  getLatestEvent,
  newAddress,
  newHash,
  oracleNode,
  personalSign,
  recoverPersonalSignature,
  stranger,
  toHex,
  toWei
} from './support/helpers'
import { assertBigNum } from './support/matchers'

contract('Coordinator', () => {
  const sourcePath = 'Coordinator.sol'
  let coordinator, link

  beforeEach(async () => {
    link = await deploy('link_token/contracts/LinkToken.sol')
    coordinator = await deploy(sourcePath, link.address)
  })

  it('has a limited public interface', () => {
    checkPublicABI(artifacts.require(sourcePath), [
      'getId',
      'executeServiceAgreement',
      'initiateServiceAgreement',
      'onTokenTransfer',
      'serviceAgreements'
    ])
  })

  describe('#getId', () => {
    it('matches the ID generated by the oracle off-chain', async () => {
      let result = await coordinator.getId.call(
        1,
        2,
        ['0x70AEc4B9CFFA7b55C0711b82DD719049d615E21d', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'],
        '0x85820c5ec619a1f517ee6cfeff545ec0ca1a90206e1a38c47f016d4137e801dd'
      )
      assert.equal(result, '0x2249a9e0a0463724551b2980299a16406da6f4e80d911628ee77445be4e04e7c')
    })
  })

  describe('#initiateServiceAgreement', () => {
    let payment, expiration, oracle, oracles, requestDigest,
      serviceAgreementID, oracleSignature

    beforeEach(() => {
      payment = newHash('1000000000000000000')
      expiration = newHash('300')
      oracle = newAddress(oracleNode)
      oracles = [oracle]
      requestDigest = newHash('0x9ebed6ae16d275059bf4de0e01482b0eca7ffc0ffcc1918db61e17ac0f7dedc8')

      serviceAgreementID = calculateSAID(payment, expiration, oracles, requestDigest)
    })

    context("with valid oracle signatures", () => {
      beforeEach(() => {
        oracleSignature = personalSign(oracle, serviceAgreementID)
        const requestDigestAddr = recoverPersonalSignature(serviceAgreementID, oracleSignature)
        assert.equal(toHex(oracle), toHex(requestDigestAddr))
      })

      it('saves a service agreement struct from the parameters', async () => {
        await coordinator.initiateServiceAgreement(
          toHex(payment),
          toHex(expiration),
          oracles.map(toHex),
          [oracleSignature.v],
          [oracleSignature.r].map(toHex),
          [oracleSignature.s].map(toHex),
          toHex(requestDigest)
        )

        const sa = await coordinator.serviceAgreements.call(toHex(serviceAgreementID))

        assertBigNum(sa[0], bigNum(toHex(payment)))
        assertBigNum(sa[1], bigNum(toHex(expiration)))
        assert.equal(sa[2], toHex(requestDigest))

        /// / TODO:
        /// / Web3.js doesn't support generating an artifact for arrays within a struct.
        /// / This means that we aren't returned the list of oracles and
        /// / can't assert on their values.
        /// /
        /// / However, we can pass them into the function to generate the ID
        /// / & solidity won't compile unless we pass the correct number and
        /// / type of params when initializing the ServiceAgreement struct,
        /// / so we have some indirect test coverage.
        /// /
        /// / https://github.com/ethereum/web3.js/issues/1241
        /// / assert.equal(
        /// /   sa[2],
        /// /   ['0x70AEc4B9CFFA7b55C0711b82DD719049d615E21d', '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07']
        /// / )
      })

      it('returns the SAID', async () => {
        const said = await coordinator.initiateServiceAgreement.call(
          toHex(payment),
          toHex(expiration),
          oracles.map(toHex),
          [oracleSignature.v],
          [oracleSignature.r].map(toHex),
          [oracleSignature.s].map(toHex),
          toHex(requestDigest)
        )
        const expected = toHex(calculateSAID(payment, expiration, oracles, requestDigest))
        assert.equal(said, expected)
      })

      it('logs an event', async () => {
        await coordinator.initiateServiceAgreement(
          toHex(payment),
          toHex(expiration),
          oracles.map(toHex),
          [oracleSignature.v],
          [oracleSignature.r].map(toHex),
          [oracleSignature.s].map(toHex),
          toHex(requestDigest)
        )
        
        const event = await getLatestEvent(coordinator)
        const expected = toHex(calculateSAID(payment, expiration, oracles, requestDigest))
        assert.equal(expected, event.args.said)
      })
    })

    context("with an invalid oracle signatures", () => {
      beforeEach(() => {
        oracleSignature = personalSign(newAddress(stranger), serviceAgreementID)
        const requestDigestAddr = recoverPersonalSignature(serviceAgreementID, oracleSignature)
        assert.notEqual(toHex(oracle), toHex(requestDigestAddr))
      })

      it('saves a service agreement struct from the parameters', async () => {
        assertActionThrows(async () => {
          await coordinator.initiateServiceAgreement(
            toHex(payment),
            toHex(expiration),
            oracles.map(toHex),
            [oracleSignature.v],
            [oracleSignature.r].map(toHex),
            [oracleSignature.s].map(toHex),
            toHex(requestDigest)
          )
        })

        const sa = await coordinator.serviceAgreements.call(toHex(serviceAgreementID))
        assertBigNum(sa[0], bigNum(0))
        assertBigNum(sa[1], bigNum(0))
        assert.equal(sa[2], '0x0000000000000000000000000000000000000000000000000000000000000000')
      })
    })
  })

  describe('#executeServiceAgreement', () => {
    const fHash = functionSelector('requestedBytes32(bytes32,bytes32)')
    const to = '0x80e29acb842498fe6591f020bd82766dce619d43'
    const payment = 1000000000000000000
    let sAID, tx, log

    beforeEach(async () => {
      const paymentAmount = newHash(payment.toString())
      const expiration = newHash('300')
      const oracle = newAddress(oracleNode)
      const oracles = [oracle]
      const requestDigest = newHash('0x9ebed6ae16d275059bf4de0e01482b0eca7ffc0ffcc1918db61e17ac0f7dedc8')

      sAID = calculateSAID(paymentAmount, expiration, oracles, requestDigest)
      const oracleSignature = personalSign(oracle, sAID)

      await coordinator.initiateServiceAgreement(
        toHex(paymentAmount),
        toHex(expiration),
        oracles.map(toHex),
        [oracleSignature.v],
        [oracleSignature.r].map(toHex),
        [oracleSignature.s].map(toHex),
        toHex(requestDigest))

      await link.transfer(consumer, toWei(1000))
    })

    context('when called through the LINK token with enough payment', () => {
      beforeEach(async () => {
        const payload = executeServiceAgreementBytes(toHex(sAID), to, fHash, '1', '')
        tx = await link.transferAndCall(coordinator.address, payment, payload, {
          from: consumer
        })
        log = tx.receipt.logs[2]
      })

      it('logs an event', async () => {
        assert.equal(coordinator.address, log.address)

        // If updating this test, be sure to update services.RunLogTopic.
        let eventSignature = '0x6d6db1f8fe19d95b1d0fa6a4bce7bb24fbf84597b35a33ff95521fac453c1529'
        assert.equal(eventSignature, log.topics[0])

        assert.equal(toHex(sAID), log.topics[1])
        assert.equal(consumer, web3.toDecimal(log.topics[2]))
        assert.equal(payment, web3.toDecimal(log.topics[3]))
      })
    })

    context('when called through the LINK token with not enough payment', () => {
      it('throws an error', async () => {
        const calldata = executeServiceAgreementBytes(toHex(sAID), to, fHash, '1', '')
        const underPaid = bigNum(payment).sub(1)

        await assertActionThrows(async () => {
          tx = await link.transferAndCall(coordinator.address, underPaid, calldata, {
            from: consumer
          })
        })
      })
    })

    context('when not called through the LINK token', () => {
      it('reverts', async () => {
        await assertActionThrows(async () => {
          await coordinator.executeServiceAgreement(0, 0, 1, toHex(sAID), to, fHash, 'id', '', {from: consumer})
        })
      })
    })
  })
})
