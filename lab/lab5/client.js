"use strict";

const crypto = require('crypto');
const keypair = require('keypair');
const EventEmitter = require('events');

const SIG_ALG = 'RSA-SHA256';

const JOIN = "JOIN_NETWORK_REQUEST";
const SYNC = "SYNC_LEDGER";
const XFER = "XFER_FUNDS";

class Client extends EventEmitter {
  constructor(name, net) {
    super();
    this.name = name;
    this.net = net;

    this.keypair = keypair();
    this.net.registerMiner(this);

    // The following lines could be deleted without ill effect.
    // The important point is that a new client starts up without
    // knowing what the ledger is.
    this.ledger = undefined;
    this.clients = undefined;

    this.on(JOIN, this.addClient);
    this.on(XFER, this.updateLedger);
    this.on(SYNC, this.initialize);

    this.join();
  }

  join() {
    // Broadcast out name and public key
    let msg = { name: this.name, pubKey: this.keypair.public };
    this.net.broadcast(JOIN, msg);
  }

  initialize({ ledger, clients, name, signature }) {
    // 1) Verify that this request is needed
    if (this.ledger !== undefined && this.clients !== undefined) return;

    // 2) Update ledger
    this.ledger = ledger;
    this.clients = clients;
  }

  addClient({ name, pubKey }) {
    // If the ledger has not been initialized, ignore it
    if (this.ledger === undefined || this.clients === undefined) return;
    if (this.ledger[name] !== undefined) {
      // this.log(`${name} already exists in the network.`);
      return;
    }

    // New clients always begin with no funds.
    this.ledger[name] = 0;
    this.clients[name] = pubKey;

    this.log(`${this.name} added ${name} to the network.`)

    // Send the client the latest ledger and client information
    this.net.send(name, SYNC, { ledger: this.ledger, clients: this.clients });
  }

  give(name, amount) {
    //
    // ***YOUR CODE HERE***
    //
    // 1) Make JSON object message to transfer money to another user
    let msg = ({
      from: this.name,
      to: name,
      amount: amount
    })

    // 2) Sign the message
    let signature = this.signObject(msg)

    // 3) Broadcast signed message
    this.net.broadcast(XFER, { message: msg, signature: signature })
  }

  updateLedger({ message, signature }) {
    // Ensure the client is ready to start processing requests.
    if (this.ledger === undefined) return;

    //
    // ***YOUR CODE HERE***
    //
    // 1) Verify signature
    let validSign = this.verifySignature({
      message: message,
      name: message.from,
      signature: signature
    })

    if (!validSign) {
      this.log(`${message.from} Invalid signature`)
      return
    }

    // 2) Verify accounts exist
    if (this.ledger[message.from] === undefined || this.ledger[message.to] === undefined) {
      this.log(`${message.from} Account does not exist`)
      return
    }

    // 3) Verify the sender has sufficient funds
    if (this.ledger[message.from] < message.amount) {
      this.log(`${message.from} Insufficient funds`)
      return;
    }

    // 4) Update the ledger
    this.ledger[message.from] -= message.amount
    this.ledger[message.to] += message.amount
  }

  // Placeholder method.
  punishCheater(name) {
    this.log(`Punishing ${name}`);
  }

  signObject(o) {
    let s = JSON.stringify(o);
    let signer = crypto.createSign(SIG_ALG);
    return signer.update(s).sign(this.keypair.private, 'hex');
  }

  verifySignature({ message, name, signature }) {
    let s = JSON.stringify(message);
    let verifier = crypto.createVerify(SIG_ALG);
    let pubKey = this.clients[name];
    try {
      return verifier.update(s).verify(pubKey, signature, 'hex');
    } catch (e) {
      this.log(`Error validating signature: ${e.message}`);
      return false;
    }
  }

  showLedger() {
    let s = JSON.stringify(this.ledger);
    this.log(s);
  }

  log(m) {
    console.log(this.name + " >>> " + m);
  }
}

exports.Client = Client;
exports.JOIN = JOIN;
exports.SYNC = SYNC;
exports.XFER = XFER;

