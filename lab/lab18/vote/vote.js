"use strict";

const Web3 = require('web3');
const fs = require('fs')

let url = "http://localhost:7545";
let web3 = new Web3(url);
let contractName = 'Vote_sol_Vote';

if (process.argv0 === 'node') {
  process.argv.shift();
}
let contractAddress = process.argv[1];
let from = process.argv[2];

let abi = JSON.parse(fs.readFileSync(`${contractName}.abi`).toString());
let contract = new web3.eth.Contract(abi);
contract.options.address = contractAddress;

// Voting green.
contract.methods.vote(true).send({
  from: from,
}).then(console.log);
