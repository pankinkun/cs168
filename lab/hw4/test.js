"use strict";

const SpartanPyrite = require('./spartan-pyrite');

// Hard-coded arguments
let from = "0x2aF1408aAACf96fD117eeBc148B11767B354cb37";
let to = "0xAe750a1154F072A130bb90609c05Ff1f6bDFA7e6";
let sgAddr = "7i4EPXqdAX6gClju3EW/FdZB0HR179xjqo1zglRqijM=";

if (process.argv0 === 'node') {
  process.argv.shift();
}

let sp;
let pr;

// If the contract has been deployed previously,
// you can specify its address.
if (process.argv.length === 2) {
  let contractAddress = process.argv[1];
  sp = new SpartanPyrite({ contractAddress});
  pr = Promise.resolve();
} else {
  // If the contract is being deployed, transfer 1000 SPYR
  // to the 'to' address.
  sp = new SpartanPyrite();
  pr = sp.deploy(from)
         .then(() => sp.transfer(from, to, 1000));
}

pr.then(() => sp.burn(to, 321))
  .then(() => sp.setSpartanGoldAddr(to, sgAddr))
  .then(() => sp.getBurnDetails(to))
  .then(([act,amt]) => console.log(`Burned ${amt} for ${act}.`))
  .then(() => sp.getBurned(to))
  .then(() => sp.getSpartanGoldAddr(to));