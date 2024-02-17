"use strict";

let blindSignatures = require('blind-signatures');

let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

function verify(unblinded, msg, n, e) {
  return blindSignatures.verify({
    unblinded: unblinded,
    N: n,
    E: e,
    message: msg,
  });
}


let agency = new SpyAgency();

//
// ***YOUR CODE HERE***
//
// Prepare 10 documents with 10 different cover identities (using the makeDocument function).
// Blind each of the 10 documents, and remember to store their blinding factors.
//

let originalDocs = []
let blindDocs = []
let blindingFactors = []
let signature
let verifyValue

for (let i = 1; i <= 10; i++) {
  // Create documents
  let doc = makeDocument(i.toString())
  originalDocs.push(doc)

  // Blind documents
  let blindedDoc = blind(doc, agency.n, agency.e)
  blindDocs.push(blindedDoc.blinded)

  // Store blinding factors
  blindingFactors.push(blindedDoc.r)
}

agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  //
  // ***YOUR CODE HERE***
  //
  // The 'signDocument' function takes a callback function, which
  // specifies which of the 10 documents the spy agency will sign.
  //
  // You must call the 'verifyAndSign' function, specifying arrays with:
  // 1) the blinding factors
  // 2) the original documents
  //
  // Note that you should specify this information for all documents
  // EXCEPT the specified document.  (In the selected position, set
  // these positions to 'undefined'.)
  //
  // The verifyAndSign function will return the blinded signature.
  // Unblind it, and make sure that the signature is valid for
  // the selected document.

  blindingFactors[selected] = undefined
  originalDocs[selected] = undefined

  signature = verifyAndSign(blindingFactors, originalDocs)

  let unblindedSignature = unblind(blindingFactors[selected], signature, agency.n)

  verifyValue = verify(unblindedSignature, originalDocs[selected], agency.n, agency.e)
});

verifyValue ? console.log('Signature is valid') : console.log('Signature is invalid')



