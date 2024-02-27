"use strict";

const EventEmitter = require('events');

const {
  Coin, NUM_COINS_REQUIRED, REGISTER, DEPOSIT, BUY, REVELATION,
  REDEEM_COIN, SELECTION, COIN_SIGNED, COIN_TOSS, COIN_MINTED,
  REQUEST_RIS, RIS, COIN_RIS_LENGTH, COIN_ACCEPTED,
} = require('./coin.js');

const utils = require('./utils.js');
const FakeNet = require('./fake-net.js');


// Simple class simulating a client in out network.  For simplicity sake, a
// client can only hold 2 coins at a time:
// * one for spending (this.coin), and
// * one to accept and redeem with the bank (this.receivedCoin).
class Client extends EventEmitter {

  /**
   * A client is identified by their name, which is used as both an address on
   * the fake "network" and as the name of their bank account.
   * 
   * For convenience, the bank is passed as an argument to get both the address
   * and the public key for future reference.
   * 
   * @param {string} name - The name of the client.
   * @param {FakeNet} fakeNet - The fake "network" the client uses to communicate.
   * @param {Bank} bank - The bank used by the client.
   */
  constructor(name, fakeNet, bank) {
    super();
    this.name = name;
    this.bankPubKey = bank.keypair.public;
    this.fakeNet = fakeNet;

    // Fields needed for fakeNet
    this.address = name;
    this.bankAddress = bank.address;

    this.on(SELECTION, this.provideUnselectedCoinStrings);
    this.on(COIN_SIGNED, this.receiveCoinSig);
    this.on(COIN_TOSS, this.acceptCoin);
    this.on(REQUEST_RIS, this.provideRandomIdentityString);
    this.on(RIS, this.verifyRandomIdentityString);
  }

  /**
   * Convenience method to send a message to the bank on the fake "network".
   * 
   * @param {string} msg - The type of message being sent to the bank.
   * @param {Object} o - parameters of the message to the bank.
   */
  sendToBank(msg, o) {
    this.fakeNet.sendMessage(this.bankAddress, msg, o);
  }

  /**
   * Contacts the bank to create a new account for the client.
   */
  registerWithBank() {
    this.sendToBank(REGISTER, { account: this.name });
  }

  /**
   * Deposits money in the client's account.
   * 
   * @param {number} amount - Amount of money to deposit in the client's account.
   */
  deposit(amount) {
    this.sendToBank(DEPOSIT, { account: this.name, amount: amount });
  }

  /**
   * Initializes the process of buying a coin from the bank. This approach uses
   * a "cut-and-choose" strategy, where the client prepares several coins,
   * sends the hashes, and lets the bank select the coin to sign.
   * 
   * @param {number} amount - The amount that the coin should be for.
   */
  buyCoin(amount) {
    if (this.coin !== undefined) {
      throw new Error("Cannot buy a second coin.");
    }

    this.preparedCoins = [];
    let coinHashes = [];

    //
    // ***YOUR CODE HERE***
    //
    // Create 10 coins by calling Coin.makeCoin.
    // Hash the coins (using the Coin class's hashInput method and utils.hash)
    // and send the array of hashes to the bank.

    for (let i = 0; i < 10; i++) {
      let coin = Coin.makeCoin(this.name, amount)
      this.preparedCoins.push(coin)
      coinHashes.push(utils.hash(coin.hashInput()))
    }

    this.sendToBank(BUY, {
      account: this.name,
      amount: amount,
      coinHashes: coinHashes,
    });
  }

  /**
   * Once the bank has selected a coin hash to sign, the client must reveal all
   * coins that were _not_ selected. The selected coin should not be sent, so
   * that there is no way for the bank to know the GUID of the coin (at least
   * until the coin is actually redeemed -- that weakness would be fixed if we
   * actually used blind signatures.)
   * 
   * @param {Object} obj - The arguments from the bank.
   * @param {number} obj.selected - The index of the bank-selected coin hash.
   */
  provideUnselectedCoinStrings({ selected }) {
    console.log(`Bank selected coin ${selected}.`);
    // Storing the selected coin for future reference.
    this.coin = this.preparedCoins[selected];

    //
    // ***YOUR CODE HERE***
    //
    // Once the coin has ben selected, the client must serialize all other
    // coins and send them to the bank. The Coin class has a serializeForBank
    // method that will produce this in the right format.
    //
    // Using the sendToBank method, send the revealed coins (but **NOT** the
    // selected coin) to the bank. The message the bank expects is "REVELATION".

    let serializedCoins = this.preparedCoins.filter((coin, i) => i !== selected)

    serializedCoins.map((coin) => coin.serializeForBank())

    this.sendToBank(REVELATION, {
      account: this.name,
      coinStrArr: serializedCoins
    })
  }

  /**
 * This method is where the unblinding of the signature _should_ be.
 * 
 * @param {Buffer} signature - the blinded signature.
 * 
 * @returns {Buffer} - the unblinded signature.
 */
  unblind(signature) {
    return signature;
  }

  /**
   * Receives the coin signature from the bank. After verifying that the
   * signature is valid, it triggers a "COIN_MINTED" event to alert the client
   * that the coin is ready for spending.
   * 
   * @param {Object} obj - The arguments from the bank.
   * @param {number} obj.coinSig - The signature for the coin.
   */
  receiveCoinSig({ coinSig }) {
    console.log(`***HAVE RECEIVED A SIGNED COIN ${this.coin.guid}***`);
    this.coin.signature = this.unblind(coinSig);
    if (!this.coin.verifySignature(this.bankPubKey)) {
      throw new Error(`Invalid signature for ${this.coin.guid}.`);
    }

    // Signals to the client that the coin is ready for spending.
    this.emit(COIN_MINTED);
  }

  /**
   * Transfers a coin to another user, deleting it from this user.
   * 
   * @param {string} receiver - The receiver of the coin.
   */
  giveCoin(receiver) {
    if (!this.coin) {
      throw new Error('Do not have a coin');
    }
    this.fakeNet.sendMessage(receiver, COIN_TOSS, {
      senderAddress: this.name,
      coinStr: this.coin.serializePublic(),
    });
  }

  /**
   * Procedure for a client accepting a token. The client receiving the coin
   * verifies the signature and then randomly selects the left or right halves
   * of the identity halves. The left/right selections are sent back to the
   * client spending the coin.
   * 
   * @param {Object} obj - The arguments from the spending client.
   * @param {string} obj.senderAddress - Address of client spending the coin.
   * @param {string} obj.coinStr - The coin in JSON format.
   */
  acceptCoin({ senderAddress, coinStr }) {
    this.receivedCoin = new Coin(JSON.parse(coinStr));

    console.log(`Received coin ${this.receivedCoin.guid}.`);

    this.lrSelections = [];

    //
    // ***YOUR CODE HERE***
    //
    // For this portion:
    // 1. Verify the signature on the coin.
    // 2. Send the random picks for RIS, storing them in this.lrSelections.

    if (!this.receivedCoin.verifySignature(this.bankPubKey)) {
      throw new Error(`Invalid signature for ${this.receivedCoin.guid}`)
    }

    this.receiveCoinSig({ coinSig: this.receivedCoin.signature })

    for (let i = 0; i < COIN_RIS_LENGTH; i++) {
      this.lrSelections.push(Math.random() > 0.5)
    }

    this.fakeNet.sendMessage(senderAddress, REQUEST_RIS, {
      receiver: this.name,
      lrSelections: this.lrSelections,
    });
  }

  /**
   * Given the receiving client's choices, the sending client builds up a
   * random identity string (RIS). One RIS reveals no information about the
   * identity of the sender. The RIS must be sent to the receiving client to
   * complete the exchange.
   * 
   * @param {Object} obj - The arguments from the receiving client.
   * @param {string} obj.receiver - Address of client receiving the coin.
   * @param {[boolean]} obj.lrSelections - The left/right choices for identity
   *    pairs. True indicates that the left half of the identity should be used.
   */
  provideRandomIdentityString({ receiver, lrSelections }) {
    console.log(`Received lrSelections from ${receiver}.`);
    let ris = [];
    for (let i = 0; i < COIN_RIS_LENGTH; i++) {
      ris[i] = this.coin.getRis(lrSelections[i], i);
    }

    this.fakeNet.sendMessage(receiver, RIS, {
      senderAddress: this.name,
      ris: ris,
    });
  }

  /**
   * Verifies that the RIS returned by the sender matches the hashes encoded in
   * the coin. If they do, the coin is accepted and may be redeemed with the
   * bank. A "COIN_ACCEPTED" event notifies the client that the coin is available
   * and ready to be used.
   * 
   * @param {Object} obj - The arguments from the sending client.
   * @param {[Buffer]} obj.ris - Encrypted halves of the sender's identity.
   */
  verifyRandomIdentityString({ ris }) {
    // Buffers don't do JSON very well. The deserializeBufferArray deals
    // with the ugliness.
    ris = utils.deserializeBufferArray(ris);

    // ***YOUR CODE HERE***
    //
    // Get the expected hashes from this.lrSelections.
    // Compare them against the _actual_ hashes of the ris.
    // Throw an error if any of them do not match.

    this.ris = ris;

    this.lrSelections.map((isLeft, i) => {
      let half = this.receivedCoin.getRis(isLeft, i)

      if (utils.hash(half) !== utils.hash(ris[i])) {
        throw new Error('Invalid hash')
      }
    })

    console.log("Accepting coin as valid.");

    this.emit(COIN_ACCEPTED);
  }

  /**
   * Redeems the coin (this.receivedCoin) from the bank. The coin and the
   * random identity string for the coin (this.ris) are then deleted from
   * the client.
   */
  redeemCoin() {
    this.fakeNet.sendMessage(this.bankAddress, REDEEM_COIN, {
      account: this.name,
      coin: this.receivedCoin.serializePublic(),
      ris: this.ris,
    });
    delete this.receivedCoin;
    delete this.ris;
  }
}

exports.Client = Client;

