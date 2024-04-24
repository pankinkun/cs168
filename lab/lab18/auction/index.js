"use strict";

const Web3 = require('web3');

let web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
let account;
web3.eth.getAccounts().then((f) => {
 account = f[0];
});

// Load the ABI produced by the compiler
let abi = JSON.parse('[{"inputs":[],"name":"getHighBidder","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTopBid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"name","type":"bytes32"},{"internalType":"uint256","name":"bid","type":"uint256"}],"name":"makeBid","outputs":[],"stateMutability":"nonpayable","type":"function"}]');

// Load the contract.
let contract = new web3.eth.Contract(abi);
contract.options.address = "0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005";

function makeBid() {
  let bid = parseInt($("#bid").val());
  // ***YOUR CODE HERE***
  // Get the bidder (converting to hex), and then call
  // the makeBid function from your smart contract.
  
  let bidder = web3.utils.asciiToHex($("#bidder").val())

  contract.methods.makeBid(bidder, bid).send({from: account}).then(updateResults)
}

function updateResults() {
  // ***YOUR CODE HERE***

  contract.methods.getHighBidder().call().then((f) => {
    $("#highBidder").html(f);
  });

  contract.methods.getTopBid().call().then((f) => {
    $("#topBid").html(f);
  });
}

// Load initial results upon loading.
updateResults();

