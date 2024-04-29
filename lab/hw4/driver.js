"use strict";

const { Blockchain, Block, Client, FakeNet, Miner, Transaction } = require('spartan-gold');

const Banker = require('./banker');

// Hard-coding the Ethereum address.
const ETH_ADDR = "0xAe750a1154F072A130bb90609c05Ff1f6bDFA7e6";

console.log("Starting simulation.  This may take a moment...");

if (process.argv.length < 3) {
  console.error("Usage: node driver.js <contract address>");5
}

let contractAddress = process.argv[2];

let fakeNet = new FakeNet();

// Clients
let alice = new Client({name: "Alice", net: fakeNet});
let bob = new Client({name: "Bob", net: fakeNet});
let charlie = new Client({name: "Charlie", net: fakeNet});

// Miners
let minnie = new Miner({name: "Minnie", net: fakeNet});
let mickey = new Miner({name: "Mickey", net: fakeNet});

// Initially, Scrooge holds all SpartanGold corresponding to SpartanPyrite tokens.
let scrooge = new Banker({name: "Scrooge", net: fakeNet, contractAddress});

// Creating genesis block
let genesis = Blockchain.makeGenesis({
  blockClass: Block,
  transactionClass: Transaction,
  clientBalanceMap: new Map([
    [alice, 233],
    [bob, 99],
    [charlie, 67],
    [minnie, 400],
    [mickey, 300],
    [scrooge, 100000],
  ]),
});

// Showing the initial balances from Alice's perspective, for no particular reason.
console.log("Initial balances:");
//showBalances(alice);
alice.showAllBalances();

fakeNet.register(alice, bob, charlie, minnie, mickey, scrooge);

// Miners start mining.
minnie.initialize();
mickey.initialize();

// Alice transfers some money to Bob.
console.log(`Alice is transferring 40 gold to ${bob.address}`);
alice.postTransaction([{ amount: 40, address: bob.address }]);

// Transferring gold equal to the burned SpartanPyrite.
setTimeout(() => {
  scrooge.mintGold(ETH_ADDR);
}, 1000);

// Print out the final balances after it has been running for some time.
setTimeout(() => {
  console.log("Final balances (Alice's perspective):");
  alice.showAllBalances();

  process.exit(0);
}, 10000);
