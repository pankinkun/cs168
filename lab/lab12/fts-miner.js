"use strict";

const { Blockchain, Miner, utils } = require('spartan-gold');


/**
 * Follow-the-satoshi protocols take a lot of forms, but in all
 * variants, the miners responsible for making a block are chosen
 * by selecting a random coin (from all available coins).
 * 
 * In our variant, the chosen miner is responsible for making the
 * next block.
 * 
 * One major issue is how the "random" input is determined, since
 * all miners must agree on this result.  In this version, we use
 * the hash of the block.
 * 
 * There are two problems with our approach:
 * 1) If the chosen miner is not available, the protocol gets stuck.
 * 2) A clever miner could bias the block to their advantage.
 */
module.exports = class FtsMiner extends Miner {

  /**
   * Pure proof-of-stake miners do not need to do
   * proof-of-work computations.
   */
  findProof() {
    // No mining needed.
  }

  /**
   * Instead of beginning to search for PoW proofs when starting up,
   * a FTS miner needs to check whether they were selected to create
   * the first block.
   */
  initialize() {
    super.initialize();
    if (this.lastBlock.nextMiner() === this.address) {
      this.log(`Creating block ${this.currentBlock.id} at height ${this.currentBlock.chainLength}`);
      this.announceProof();
    }
  }

  /**
   * When receiving a block, the miner verifies that the block is valid,
   * and then checks to see if they are the next miner; if they are, they
   * call the shareBlock method.
   * 
   * @param {Block | String} s - The block, possibly in serialized form.
   * @returns {Block} - The block, or null if the block in invalid.
   */
  receiveBlock(s) {
    let h = this.lastBlock.chainLength;
    let block = Blockchain.deserializeBlock(s);

    // Verify block is legit.
    if (block.rewardAddr !== this.lastBlock.nextMiner()) {
      this.log(`Received invalid block ${block.id} from ${block.rewardAddr}.`);
      return null;
    }
    if (!super.receiveBlock(block)) return null;

    // Test whether the miner is the next block producer.
    if (block.chainLength > h) {
      if (this.lastBlock.nextMiner() === this.address) {
        this.shareBlock();
      }
    }

    return block;
  }

  /**
   * Shares the block with the network, delaying for 0.25 seconds to allow
   * time to collect transactions.
   */
  shareBlock() {
    this.log(`Creating block ${this.currentBlock.id} at height ${this.currentBlock.chainLength}`);
    setTimeout(() => this.announceProof(), 250);
  }
}
