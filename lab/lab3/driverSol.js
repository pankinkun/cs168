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

let originalDocs = []
let blindDocs = []
let blindingFactors = []

let names = ['James Bond', 'Jason Bourne', 'Ethan Hunt', 'Jack Ryan', 'John Wick', 'Austin Powers', 'Johnny English', 'Maxwell Smart', 'Napoleon Solo', 'Harry Palmer']
names.forEach(name => {
  let doc = makeDocument(name)
  originalDocs.push(doc)

  let { blindedDoc, r } = blind(doc, agency.n, agency.e)
  blindDocs.push(blindedDoc)
  blindingFactors.push(r)
})

agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  let bfs = blindingFactors.slice()
  delete bfs[selected]

  let selectedLetter = originalDocs.slice()
  delete selectedLetter[selected]

  let signature = verifyAndSign(bfs, selectedLetter)

  let unblindedSignature = unblind(blindingFactors[selected], signature, agency.n)

  let verifyValue = verify(unblindedSignature, originalDocs[selected], agency.n, agency.e)
});



