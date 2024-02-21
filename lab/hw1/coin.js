"use strict";

const utils = require('./utils.js');

const NUM_COINS_REQUIRED = 10;
const COIN_RIS_LENGTH = 20;

// Constants for our coin format.
const BANK_STR = "ELECTRONIC_PIGGYBANK";
const IDENT_STR = "IDENT";

// Messages used for our clients and the bank to interact.
const REGISTER = "REGISTER";
const DEPOSIT = "DEPOSIT";
const SHOW_BALANCES = "SHOW_BALANCES";
const BUY = "BUY";
const REVELATION = "REVELATION";
const REDEEM_COIN = "REDEEM_COIN";
const SELECTION = "SELECTION";
const COIN_SIGNED = "COIN_SIGNED";
const COIN_MINTED = "COIN_MINTED";
const COIN_TOSS = "COIN_TOSS";
const REQUEST_RIS = "REQUEST_RIS";
const RIS = "RIS";

// A class representing a single DigiCash-lite coin.
// Note that this coin should not be shared with the bank
// if anonymity is desired.
class Coin {

  /**
   * Creates a new coin for the specified user with the specified amount.
   * 
   * @param {string} account - account of the user purchasing the coin.
   * @param {number} amount - amount the coin should be for.
   * @returns - the newly created (but unsigned) coin.
   */
  static makeCoin (account, amount) {
    let coin = new Coin({ account, amount });
    coin.initialize(account, amount);
    return coin;
  }

  /**
   * The constructor is called directly when the coin is available as a JSON
   * string.  Otherwise, Coin.makeCoin() should be used instead.
   * 
   * @param {Object} o - Parameters of the coin in JSON format.
   */
  constructor(o={}) {
    this.account = o.account;
    this.amount = o.amount;
    this.guid = o.guid;
    this.leftHashes = o.leftHashes;
    this.rightHashes = o.rightHashes;
    this.signature = o.signature;

    // The identities are in buffers, so we have to read them back into buffers.
    if (o.leftIdent && o.rightIdent) {
      this.leftIdent = utils.deserializeBufferArray(o.leftIdent);
      this.rightIdent = utils.deserializeBufferArray(o.rightIdent);

      if (!this.hasValidHashes()) {
        throw new Error("Error in deserialization.");
      }
    }
  }

  /**
   * When a new coin is created, the initialize method picks a new GUID and
   * one-time pad encodings of the client's identity. It also adds hashes of
   * the one-time pad key/ciphertext pairs.
   */
  initialize() {
    if (this.guid !== undefined) {
      throw new Error("Coin already initialized.")
    }

    this.guid = utils.makeGUID();
    this.leftIdent = [];
    this.rightIdent = [];

    this.leftHashes = [];
    this.rightHashes = [];

    for (let i=0; i<COIN_RIS_LENGTH; i++) {
      // Making an OTP for the identity string.
      let { key, ciphertext } = utils.makeOTP({
        string: `${IDENT_STR}:${this.account}`,
      });

      this.leftIdent.push(key);
      this.leftHashes.push(utils.hash(key));

      this.rightIdent.push(ciphertext);
      this.rightHashes.push(utils.hash(ciphertext));
    }
  }

  /**
   * Tests whether the coin identifies the specified account.
   * 
   * @param {string} account - account of the owner of the coin.
   * 
   * @returns {boolean} - true if the coin identifies the specified account.
   */
  identifies(account) {
    for (let i=0; i<COIN_RIS_LENGTH; i++) {
      let left = this.leftIdent[i];
      let right = this.rightIdent[i];
      let identStr = utils.decryptOTP({
          key: left,
          ciphertext: right,
          returnType: "string"
      });
      if (!identStr.startsWith(IDENT_STR)) {
        return false;
      }
      let id = identStr.split(':')[1];
      if (id !== account) {
        return false;
      }
    }
    return true;
  }

  /**
   * Tests whether the hashes match the key/ciphertext one-time pad encodings
   * embedded in the coin.
   * 
   * @returns {boolean} - true if the hashes match.
   */
  hasValidHashes() {
    for (let i=0; i<COIN_RIS_LENGTH; i++) {
      let leftId = this.leftIdent[i];
      let leftHashExpected = this.leftHashes[i];
      if (utils.hash(leftId) !== leftHashExpected) {
        return false;
      }

      let rightId = this.rightIdent[i];
      let rightHashExpected = this.rightHashes[i];
      if (utils.hash(rightId) !== rightHashExpected) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a JSON representation of the string, including only the "public"
   * fields that reveal no information about the identity of the account who
   * purchased the coin.
   * 
   * This representation is used when sending a coin to other clients, or when
   * sending a coin to the bank to be redeemed.
   * 
   * @returns {string} - JSON string of the coin.
   */
  serializePublic() {
    return JSON.stringify(this, ["signature", "amount", "guid", "leftHashes", "rightHashes"])
  }

  /**
   * Returns a JSON representation of the coin, __including the private fields
   * revealing the purchaser's identity__. This version is used to send the
   * coin to the bank during the "reveal" phase of the cut-and-choose.
   * 
   * It should only be sent to the bank, and only when buying a coin.
   * 
   * @returns {string} - JSON string of the coin.
   */
  serializeForBank() {
    return JSON.stringify(this);
  }

  /**
   * Returns the string used for calculating the coin's hash. All values in it
   * are public and may be shared.
   * 
   * @returns {string} - String representation of the coin.
   */
  hashInput() {
    return `${BANK_STR}-${this.amount}-${this.guid}-${this.leftHashes.join(',')}-${this.rightHashes.join(',')}`;
  }

  toString() {
    this.hashInput();
  }

  /**
   * For an RIS at position i, returns either the left or right half of the
   * identity pair.
   * 
   * @param {boolean} isLeft - true if the left half should be returned.
   * @param {number} i - index position of the RIS to use.
   * 
   * @returns {Buffer} - Half of a user's encrypted identity.
   */
  getRis(isLeft, i) {
    if (isLeft) {
      return this.leftIdent[i];
    } else {
      return this.rightIdent[i];
    }
  }

  /**
   * For an RIS at position i, returns the hash corresponding to either the
   * left or right half of the identity pair.
   * 
   * @param {boolean} isLeft - true if the left half should be returned.
   * @param {number} i - index position of the RIS hash to use.
   * 
   * @returns {string} - Hash of RIS element in hex format.
   */
  getRisHash(isLeft, i) {
    if (isLeft) {
      return this.leftHashes[i];
    } else {
      return this.rightHashes[i];
    }
  }

  /**
   * Verifies that the signature on the coin is valid.
   * 
   * @param {Buffer} pubKey - Public key of the bank that signed the coin.
   * 
   * @returns {boolean} - true if the signature is valid.
   */
  verifySignature(pubKey) {
    let h = utils.hash(this.hashInput());
    return utils.verifySignature(pubKey, h, this.signature);
  }
}

exports.Coin = Coin;
exports.COIN_RIS_LENGTH = COIN_RIS_LENGTH;
exports.IDENT_STR = IDENT_STR;
exports.BANK_STR = BANK_STR;
exports.NUM_COINS_REQUIRED = NUM_COINS_REQUIRED;
exports.REGISTER = REGISTER;
exports.DEPOSIT = DEPOSIT;
exports.SHOW_BALANCES = SHOW_BALANCES;
exports.BUY = BUY;
exports.REVELATION = REVELATION;
exports.REDEEM_COIN = REDEEM_COIN;
exports.SELECTION = SELECTION;
exports.COIN_SIGNED = COIN_SIGNED;
exports.COIN_MINTED = COIN_MINTED;
exports.COIN_TOSS = COIN_TOSS;
exports.REQUEST_RIS = REQUEST_RIS;
exports.RIS = RIS;

