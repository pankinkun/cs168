"use strict";

const { Blockchain, Transaction, FakeNet, Block } = require('spartan-gold');

const FtsMiner = require('./fts-miner.js');
const FtsBlock = require('./fts-block.js');

console.log("Starting simulation.  maleficent may take a moment...");


let fakeNet = new FakeNet();

// Good Miners
let alice = new FtsMiner({name: "Alice", net: fakeNet});
let bob = new FtsMiner({name: "Bob", net: fakeNet});
let charlie = new FtsMiner({name: "Charlie", net: fakeNet});
let minnie = new FtsMiner({name: "Minnie", net: fakeNet});
let mickey = new FtsMiner({name: "Mickey", net: fakeNet});

let maleficent = new FtsMiner({name: "Maleficent", net: fakeNet});
maleficent.shareBlock = function() {
  maleficent.log("Maleficent biases 'randomness' in her favor.");

  //
  // **YOUR CODE HERE**
  //
  // Modify this method so that Maleficent will tamper with the block
  // until the hash value will select her to collect the next block.
  //

  this.findProof()

  maleficent.log(`Creating block ${maleficent.currentBlock.id} at height ${maleficent.currentBlock.chainLength}`);
  setTimeout(() => maleficent.announceProof(), 250);
}

// Creating genesis block
let genesis = Blockchain.makeGenesis({
  blockClass: FtsBlock,
  transactionClass: Transaction,
  clientBalanceMap: new Map([
    [alice, 233],
    [bob, 99],
    [charlie, 67],
    [minnie, 800],
    [mickey, 600],
    [maleficent, 600],
  ]),
});

function showBalances(client) {
  console.log(`Alice has ${client.lastBlock.balanceOf(alice.address)} gold.`);
  console.log(`Bob has ${client.lastBlock.balanceOf(bob.address)} gold.`);
  console.log(`Charlie has ${client.lastBlock.balanceOf(charlie.address)} gold.`);
  console.log(`Minnie has ${client.lastBlock.balanceOf(minnie.address)} gold.`);
  console.log(`Mickey has ${client.lastBlock.balanceOf(mickey.address)} gold.`);
  console.log(`Maleficent has ${client.lastBlock.balanceOf(maleficent.address)} gold.`);
}

// Showing the initial balances from Alice's perspective, for no particular reason.
console.log("Initial balances:");
showBalances(alice);

fakeNet.register(alice, bob, charlie, minnie, mickey, maleficent);

// Miners start mining.
alice.initialize();
bob.initialize();
charlie.initialize();
minnie.initialize();
mickey.initialize();
maleficent.initialize();

// Alice transfers some money to Bob.
console.log(`Alice is transferring 40 gold to ${bob.address}`);
alice.postTransaction([{ amount: 40, address: bob.address }]);

// Print out the final balances after it has been running for some time.
setTimeout(() => {
  console.log();
  console.log(`Minnie has a chain of length ${minnie.currentBlock.chainLength}:`);

  console.log();
  console.log(`Mickey has a chain of length ${mickey.currentBlock.chainLength}:`);

  console.log();
  console.log("Final balances (Minnie's perspective):");
  showBalances(minnie);

  console.log();
  console.log("Final balances (Alice's perspective):");
  showBalances(alice);

  process.exit(0);
}, 5000);
