"use strict";

const EventEmitter = require('events');

const utils = require('./utils.js');
const {
  Coin, IDENT_STR, NUM_COINS_REQUIRED, REGISTER, DEPOSIT, BUY, REVELATION,
  REDEEM_COIN, SELECTION, COIN_SIGNED,
} = require('./coin.js');
const FakeNet = require('./fake-net.js');

// This class represents a bank issuing DigiCash-lite coins.
class Bank extends EventEmitter {
  /**
   * Creates a new Bank instance.
   * 
   * @param {FakeNet} fakeNet - The fake "network" used by the bank.
   */
  constructor(fakeNet) {
    super();
    this.fakeNet = fakeNet;

    // Field needed for fakeNet
    this.address = "BANK";

    this.keypair = utils.generateKeyPair();
    this.ledger = {};
    this.coinDB = {}; // tracks previously redeemed coins
    this.sessions = {};

    // Each event simulates an incoming network message from a client.
    this.on(REGISTER, this.registerClient);
    this.on(DEPOSIT, this.deposit);
    this.on(BUY, this.sellCoin);
    this.on(REVELATION, this.verifyAndMint);
    this.on(REDEEM_COIN, this.redeemCoin);
  }

  /**
   * Prints out the balances for all of the bank's customers.
   * 
   * @param {string} title - Title printed out with the balances.
   */
  showBalances(title) {
    // Calling setTimeout so that balances do not print
    // before the rest of the code is run.
    setTimeout(() => {
      console.log(title);
      console.log(JSON.stringify(this.ledger));
    }, 0);
  }

  /**
   * Initializes a client's account with 0 value.
   * 
   * @param {string} account - The name of the owner of the account. 
   */
  registerClient({ account }) {
    this.ledger[account] = 0;
  }

  /**
   * Updates the ledger to account for money submitted directly to the bank.
   * 
   * @param {Object} obj - The arguments to the function.
   * @param {string} obj.account - The account to submit money to.
   * @param {number} obj.amount - The amount of money to add to the account.
   */
  deposit({ account, amount }) {
    if (this.ledger[account] === undefined) {
      throw new Error(`${account} is not a registered customer of the bank.`);
    }
    console.log(`Depositing ${amount} into account for ${account}.`);
    this.ledger[account] += amount;
  }

  /**
   * Verifies that a bank customer has sufficient funds for a transaction.
   * 
   * @param {Object} obj - The arguments to the function.
   * @param {string} obj.account - The account to check.
   * @param {number} obj.amount - The amount of money required.
   * 
   * @returns {boolean} - True if there are sufficient funds.
   */
  verifyFunds({ account, amount }) {
    if (this.ledger[account] === undefined) {
      throw new Error(`${account} is not a registered customer of the bank`);
    }
    let balance = this.ledger[account];
    return balance >= amount;
  }

  /**
   * When this function is called, the bank begins the process of minting a
   * coin for the client. The client must specify the amount of money that they
   * want the coin to be for, and they must commit themselves to the unseen
   * coins with an array of hashes.
   * 
   * The bank will store this information and reply with its selection from
   * the unseen coins.
   * 
   * @param {Object} obj - The arguments from the client.
   * @param {string} obj.account - The account which is purchasing the coin.
   * @param {number} obj.amount - The amount of money required.
   * @param {[BigInt]} obj.coinHashes - An array of hashes of the unseen coins.
   */
  sellCoin({ account, amount, coinHashes }) {
    if (this.sessions[account] !== undefined) {
      throw new Error(`A coin purchase for ${account} is already underway.`)
    }
    if (coinHashes.length < NUM_COINS_REQUIRED) {
      throw new Error(`Required #{NUM_COINS_REQUIRED} to be prepared, but only received ${coinHashes.length}`);
    }

    let selected = utils.randInt(NUM_COINS_REQUIRED);

    // Store session information.
    this.sessions[account] = { amount, coinHashes, selected };

    console.log(`Bank chooses coin ${selected} out of ${coinHashes.length}.`);

    this.fakeNet.sendMessage(account, SELECTION, { selected: selected });
  }

  /**
   * Verifies that all revealed coins are valid, with the appropriate amount,
   * encrypted identities, and hashes of the identity halves. If all coins
   * are valid, the bank will sign the hash of the unseen coin, effectively
   * "minting" new money that can be spent.
   * 
   * NOTE: This is not actually using blind signatures, so it would be possible
   * for the purchaser to be identified after the coin has been spent (if the
   * hash of the unseen coin was saved by the bank.)
   * 
   * @param {Object} obj - The arguments from the client.
   * @param {string} obj.account - The account of the client purchasing the coin.
   * @param {[string]} obj.coinStrArr - Array of coins in serialized, string format.
   */
  verifyAndMint({ account, coinStrArr }) {
    let acc = this.sessions[account];
    let sig = undefined;

    if (acc === undefined) {
      throw new Error(`No coin purchase underway for ${account}.`)
    }

    //
    // ***YOUR CODE HERE***
    //
    // Verify that all coins are valid, except for the unsent selected version.
    // The coin can be reified (that is, turned in to an object) by calling
    // JSON.parse on the coinSerialization and passing that object to
    // "new Coin".
    //
    // Verify that the hash value of all coins matches the expected hashes sent
    // previously by the client. If any do not match, throw an error.
    //
    // Verify that the amount of the coin is correct, that the coin identifies
    // the appropriate account, and that all of the hashes of the identity
    // pairs are correct. (Coin.hasValidHashes may be useful for the last part.)
    // Throw an error if anything is incorrect.
    //  
    // If everything is correct, deduct money from the purchaser's account and
    // sign the hash of the unseen, selected coin.

    for (let i = 0; i < coinStrArr.length; i++) {
      if (i === acc.selected) {
        continue
      }

      let coin = new Coin(JSON.parse(coinStrArr[i]))

      if (utils.hash(coin.hashInput()) !== acc.coinHashes[i]) {
        throw new Error("Invalid hash")
      }

      if (!coin.identifies(account) && !coin.hasValidHashes()) {
        throw new Error("Invalid amount")
      }
    }

    this.ledger[account] -= acc.amount

    sig = this.blindSign(acc.coinHashes[acc.selected])

    this.fakeNet.sendMessage(account, COIN_SIGNED, { coinSig: sig });

    // Delete session.
    delete this.sessions[account];
  }

  /**
   * "Blindly" signs the coin.  This function does not actually use blind
   * signatures, but stands in as a placeholder for that function.
   * 
   * @param {string} coinHash - The hash of the coin in Hex format.
   * @returns {Buffer} - The digital signature of the coin.
   */
  blindSign(coinHash) {
    return utils.sign(this.keypair.private, coinHash);
  }

  /**
   * If a token has been double-spent, determine who is the cheater.  If it was
   * the customer who purchased the coin, their identity is revealed.
   * 
   * @param {string} guid - A hex string of the GUID of the coin.
   * @param {Buffer} ris1 - Random identity string of the first purchase.
   * @param {Buffer} ris2 - Random identity string of the second purchase.
   */
  determineCheater(guid, ris1, ris2) {
    for (let i = 0; i < ris1.length; i++) {
      let identStr = utils.decryptOTP({
        key: ris1[i],
        ciphertext: ris2[i],
        returnType: "string"
      });
      if (identStr.startsWith(IDENT_STR)) {
        let cheater = identStr.split(':')[1];
        console.log(`${cheater} double spent coin ${guid}.`);
        return;
      }
    }
    console.log("The merchant tried to redeem the same coin twice.");
  }

  /**
   * Receives a coin from a client, verifies that the coin is valid, and pays
   * the client if it is valid. If a double-spend attempt is detected, the bank
   * uses the random identity string (RIS) to identify the cheater, potentially
   * breaking the anonymity of the coin purchaser.
   * 
   * @param {Object} obj - The arguments from the client.
   * @param {string} obj.account - The account of the client redeeming the coin.
   * @param {Coin} obj.coin - The coin being redeemed.
   * @param {[Buffer]} obj.ris - The RIS used in the exchange between clients.
   */
  redeemCoin({ account, coin, ris }) {
    coin = new Coin(JSON.parse(coin));
    ris = utils.deserializeBufferArray(ris);
    //
    //  ***YOUR CODE HERE***
    //
    // Verify that the signature on the coin is correct. If not, log a message.
    //
    // Verify that the coin has not been spent previously by making sure it is
    // not in this.coinDB.  If it _has_ been spent previously, determine the
    // cheater. Check each position of the ris against the corresponding ris in
    // this.coinDB. (You can use utils.decryptOTP to see if the 2 ris values
    // reveal the account owner's identity.)  If the two ris values are
    // identical, the merchant has attempted to redeem the coin a second time.
    //
    // If all looks good, store the Coin's guid and the ris used in this.coinDB
    // and update the client's account to give them the amount of money
    // specified by the coin.

    if (!coin.verifySignature(this.keypair.public)) {
      console.log('Invalid signature')
      return
    }

    if (coin.guid in this.coinDB) {
      this.determineCheater(coin.guid, this.coinDB[coin.guid], ris)
      return
    }

    this.coinDB[coin.guid] = ris
    this.ledger[account] += coin.amount
  }
}

exports.Bank = Bank;

