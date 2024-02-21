"use strict";

const Bank = require('./bank.js').Bank;
const Client = require('./client.js').Client;
const { Coin, COIN_ACCEPTED, COIN_MINTED } = require('./coin.js');

const FakeNet = require('./fake-net.js');

let fakeNet = new FakeNet;

let bank = new Bank(fakeNet);
let alice = new Client('Alice', fakeNet, bank);
let bob = new Client('Bob', fakeNet, bank);
let charlie = new Client('Charlie', fakeNet, bank);

// Connecting all nodes to the bank, and initializing Alice
// and Bob's accounts with the bank.
fakeNet.register(bank, alice, bob, charlie);
alice.registerWithBank();
bob.registerWithBank();
charlie.registerWithBank();

alice.deposit(200);
bob.deposit(50);
charlie.deposit(50);

bank.showBalances("Initial balances:");

setTimeout(() => {
  console.log();
  console.log("Alice buys a coin from the bank...");
  alice.buyCoin(20);
});

let aliceCoin;

// Alice gives the coin to Bob once she has received it.
alice.on(COIN_MINTED, () => {
  aliceCoin = alice.coin;
  console.log();
  console.log("Alice gives the coin to Bob...");
  alice.giveCoin('Bob');
});

bob.on(COIN_ACCEPTED, () => {
  // Saving information for Bob to double-spend.
  let c = bob.receivedCoin;
  let ris = bob.ris;
  console.log();
  console.log("Bob redeems the coin from the bank...");
  bob.redeemCoin();
  bank.showBalances("Balances after Bob redeems coin:");

  // Bob attempts to double spend.
  setTimeout(() => {
    console.log();
    console.log("Bob attempts to redeem the same coin a second time from the bank...");
    bob.receivedCoin = c;
    bob.ris = ris;
    bob.redeemCoin();
  });
});

setTimeout(() => {
  // Alice double spends the coin with Charlie.
  console.log();
  console.log("Alice attempts to double-spend the coin with Charlie...");
  alice.coin = aliceCoin;
  alice.giveCoin('Charlie');
}, 1000);

charlie.on(COIN_ACCEPTED, () => {
  console.log();
  console.log("Charlie tries to redeem the double-spent coin...");
  charlie.redeemCoin();
});

setTimeout(() => {
  bank.showBalances("Final balances:");
}, 2000);