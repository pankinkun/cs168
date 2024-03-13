"use strict";

const { Blockchain, Miner, Client, Transaction, FakeNet } = require('spartan-gold');

const CoinAgeBlock = require('./coin-age-block.js');

// This is a bit kludgy, but I am adding in extra deserialization
// steps so that the proof-of-work target can be passed along without
// a problem.  A better approach would have the receiving client
// recalculate the target... but meh.
let deserializeBlockOriginal = Blockchain.deserializeBlock;
Blockchain.deserializeBlock = function(o) {
  let block = deserializeBlockOriginal(o);
  block.adjustedTarget = o.adjustedTarget;
  return block;
}

console.log("Starting simulation.  This may take a moment...");

let fakeNet = new FakeNet();

// =Clients=
let alice = new Client({name: "Alice", net: fakeNet});
let bob = new Client({name: "Bob", net: fakeNet});
let charlie = new Client({name: "Charlie", net: fakeNet});

// =Minters=
let minnie = new Miner({name: "Minnie", net: fakeNet});
let mickey = new Miner({name: "Mickey", net: fakeNet});
let donald = new Miner({name: "Donald", net: fakeNet});
// Scrooge has substantially more money than the others.
let scrooge = new Miner({name: "Scrooge", net: fakeNet});

// Creating genesis block
//
// ***NOTE THE powLeadingZeroes SETTING***
// We need to set this higher than for PoW,
// since the coinAge settings will adjust
// the workload to be easier.
Blockchain.makeGenesis({
  blockClass: CoinAgeBlock,
  transactionClass: Transaction,
  powLeadingZeroes: 20,
  clientBalanceMap: new Map([
    [alice, 233],
    [bob, 99],
    [charlie, 67],
    [minnie, 300],
    [mickey, 300],
    [donald, 300],
    [scrooge, 3000],
  ]),
});

function showBalances(client) {
  console.log(`Alice has ${client.lastBlock.balanceOf(alice.address)} gold.`);
  console.log(`Bob has ${client.lastBlock.balanceOf(bob.address)} gold.`);
  console.log(`Charlie has ${client.lastBlock.balanceOf(charlie.address)} gold.`);
  console.log(`Minnie has ${client.lastBlock.balanceOf(minnie.address)} gold.`);
  console.log(`Mickey has ${client.lastBlock.balanceOf(mickey.address)} gold.`);
  console.log(`Donald has ${client.lastBlock.balanceOf(donald.address)} gold.`);
  console.log(`Scrooge has ${client.lastBlock.balanceOf(scrooge.address)} gold.`);
}

// Showing the initial balances from Alice's perspective, for no particular reason.
console.log("Initial balances:");
showBalances(alice);

fakeNet.register(alice, bob, charlie, minnie, mickey, donald, scrooge);

// Minters start minting.
minnie.initialize();
mickey.initialize();
donald.initialize();
scrooge.initialize();

// Alice transfers some money to Bob.
console.log(`Alice is transferring 40 gold to ${bob.address}`);
alice.postTransaction([{ amount: 40, address: bob.address }]);

// Print out the final balances after it has been running for some time.
let showFinalBalances = function() {

  // Keep going if you have not made many blocks yet.
  if (minnie.currentBlock.chainLength < 10) {
    setTimeout(showFinalBalances, 2000);
    return;
  }

  console.log();
  console.log(`Minnie has a chain of length ${minnie.currentBlock.chainLength}:`);

  console.log();
  console.log("Final balances (Minnie's perspective):");
  showBalances(minnie);

  process.exit(0);
}

setTimeout(showFinalBalances, 7000);
