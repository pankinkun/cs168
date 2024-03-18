"use strict";

const BigInteger = require('jsbn').BigInteger;

const { Block } = require('spartan-gold');

/**
 * In our version of the FTS miner, a block determines who the
 * subsequent block producer will be.
 * 
 * This approach has lots of problems...
 */
module.exports = class FtsBlock extends Block {
  /**
   * In contrast to Bitcoin, a follow-the-satoshi block is valid
   * if the right miner created it, following the random selection
   * process.
   * 
   * @override
   * 
   * @returns {Boolean} - Was this block proposed by the right miner?
   */
  hasValidProof() {
    return true;
  }

  /**
   * Returns the address of the miner that will produce the next block.
   */
  nextMiner() {
    //
    // **YOUR CODE HERE**
    //
    // "Randomly" select a gold, and then return the address of its owner.
    //

    let rouletteWheel = []

    this.balances.forEach((balance, address) => {
      for (let i = 0; i < balance; i++) {
        rouletteWheel.push(address)
      }
    })

    // console.log(this.randVal(rouletteWheel.length))

    return rouletteWheel[this.randVal(rouletteWheel.length)]
  }

  /**
   * This (badly flawed) function return a "random" value derived
   * from the block hash.  It may be abused by a clever attacker.
   * 
   * @param {Number} max - The maximum possible value to return.
   * @returns {Number} - The "random" value.
   */
  randVal(max) {
    let n = new BigInteger(this.id, 16);                                            
    return n.modInt(max);
  }
}