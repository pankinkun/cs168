  "use strict";

const { Miner, Blockchain } = require('spartan-gold');
const PoolMiner = require('./pool-miner');

const NEW_POOL_BLOCK = "NEW_POOL_BLOCK";
const SHARE_FOUND = "SHARE_FOUND";

const SHARE_REWARD = 4;

/**
 * Our base PoolOperator uses a pay-per-share (PPS) strategy.
 * This means that the operator immediately rewards a miner
 * whenever a share is found.
 * 
 * This strategy is risky for the operator, since a run of bad
 * luck could bankrupt them.  As a result, PPS mining pool
 * operators typically charge higher fees.
 * 
 * On the plus side, PPS mining pools are not vulnerable to
 * pool-hopping attacks.
 */
module.exports = class PplnsPoolOperator extends Miner {

  /**
   * A pool operator needs connections to its miners, in addition to
   * the normal miner stuff.
   */
  constructor({ name, net, startingBlock, keyPair, miningRounds, poolNet } = {}) {
    super({ name, net, startingBlock, keyPair, miningRounds, poolNet });

    this.poolNet = poolNet;

    // Copying hasValidShare method from PoolMiner class.
    this.hasValidShare = PoolMiner.prototype.hasValidShare;

    // Storing transactions for next block.
    this.transactions = new Set();

    this.rewardList = new Set()

    this.n = 0

    this.on(SHARE_FOUND, this.receiveShare);
  }

  /**
   * When it is time to search for a new block, the operator
   * broadcasts its block to the pool miners to find a new proof.
   */
  startNewSearch() {
    let block = Blockchain.makeBlock(this.address, this.lastBlock);

    // Add queued-up transactions to block.
    this.transactions.forEach((tx) => {
      block.addTransaction(tx, this);
    });
    this.transactions.clear();

    this.log(`Sending block ${block.id} to pool miners.`);

    // Needs to send the block to the pool miners
    this.poolNet.broadcast(NEW_POOL_BLOCK, block);
  }

  /**
   * In contrast to the standard version of SpartanGold, we queue up
   * transactions for the next block.
   * 
   * @param {Transaction} tx - The transaction we wish to add to the block.
   */
  addTransaction(tx) {
    tx = Blockchain.makeTransaction(tx);
    this.transactions.add(tx);
  }

  findProof() {
    // The operator does not mine.
  }

  /**
   * Rewards the pool miner that found a valid share.
   * 
   * If the block has a valid proof, then the operator
   * announces it to the network.
   */
  receiveShare(msg) {
    let { block, minerAddress } = msg;
    block = Blockchain.deserializeBlock(block);

    this.n += 1

    if (!this.hasValidShare(block)) {
      this.log(`Invalid share.`);
      return;
    }

    this.rewardMiner(minerAddress);

    if (block.hasValidProof()) {
      this.log(`Mining pool found proof for block ${block.chainLength}: ${block.proof}`);
      this.currentBlock = block;
      this.announceProof();
    }
  }

  /**
   * Different mining pools follow different strategies for rewarding miners.
   * With a PPS mining pool, the miners are rewarded for their shares immediately.
   * 
   * @param minerAddress - Address of the miner who found a share.
   */
  rewardMiner(minerAddress) {
    this.rewardList.add(minerAddress);
  }

  announceProof() {
    super.announceProof();
    if (this.n === 5) {
      this.payRewards();
      this.n = 0
    }
  }

  payRewards() {

    this.log(`Paying out ${minerReward} gold to miners.`)

    this.rewardList.forEach((minerAddress) => {
      this.log(`Paying ${minerReward} to ${minerAddress}`)
      this.postTransaction([{ address: minerAddress, amount: SHARE_REWARD }], 0)
    })

    this.rewardList.clear()
  }
}

