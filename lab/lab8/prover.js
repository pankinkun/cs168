"use strict";

const utils = require('./utils.js');
var hexToBinary = require('hex-to-binary');

class Prover {
  constructor(numLeadingZeroes) {
    this.numLeadingZeroes = numLeadingZeroes;
  }

  verifyProof(s, proof) {
    let x = utils.hash(s + proof)

    x = hexToBinary(x)

    for (let i = 0; i < this.numLeadingZeroes; i++) {
      if (x.charAt(i) !== '0') {
        return false
      }
    }

    return true;
  }

  findProof(s) {
    let proof = 0

    while (true) {
      if (this.verifyProof(s, proof)) {
        return proof
      }
      proof++
    }
  }
}

exports.Prover = Prover;



