"use strict";

const utils = require('./utils.js');

class Prover {
  constructor(numLeadingZeroes) {
    this.numLeadingZeroes = numLeadingZeroes;
  }

  verifyProof(s, proof) {
    //
    // ***YOUR CODE HERE***
    //
    let x = utils.hash(s + proof)
    for (let i = 0; i < this.numLeadingZeroes; i++) {
      console.log(x.charAt(i))
      if (x.charAt(i) !== '0') {
        return false
      }
    }

    return true;
  }

  findProof(s) {
    //
    // ***YOUR CODE HERE***
    //
    let proof = 0

    do {
      proof++
      console.log(proof)
    } while (this.verifyProof(s, proof))

    return proof
  }
}

exports.Prover = Prover;



