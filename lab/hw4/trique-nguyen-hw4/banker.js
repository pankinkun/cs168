"use strict";

const { Client } = require('spartan-gold');

const SpartanPyrite = require('./spartan-pyrite');

/**
 * The banker is a client responsible for paying out other clients
 * once they have burned their SpartanPyrite tokens.
 */
module.exports = class Banker extends Client {

  /**
   * The Banker needs the address of the SpartanPyrite contract,
   * in addition to the other configuration details for clients.
   */
  constructor(cfg) {
    super(cfg);
    this.sp = new SpartanPyrite({ contractAddress: cfg.contractAddress });
    this.burned = new Map();
  }

  /**
   * When called, the banker checks the SpartanPyrite smart contract to see how
   * many total coins have been burned by this Ethereum address and writes a
   * transaction to pay out an equal amount of gold.
   * 
   * IMPORTANT NOTE: This method should only pay out the **difference** between
   * the total amount of tokens burned and the amount of gold already given to
   * the token burner.
   * 
   * @param {String} ethAddress - Ethereum address that has burned SPYR tokens.
   */
  mintGold(ethAddress) {
    //
    // **YOUR CODE HERE**
    //

    this.sp.getBurnDetails(ethAddress)
      .then(([sgAddr, amtBurned]) => {

        if (this.burned.has(ethAddress)) {
          let amtGold = this.burned.get(ethAddress)
          let diff = Math.abs(amtBurned - amtGold)

          if (diff <= 0) {
            console.log(`No new gold to mint for ${ethAddress}.`)
            return
          }

          this.postTransaction([{ amount: diff, address: sgAddr }])
          this.burned.set(ethAddress, diff)

        } else {
          this.postTransaction([{ amount: amtBurned, address: sgAddr }])
          this.burned.set(ethAddress, amtBurned)
        }
      });
  }
}
