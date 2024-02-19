"use strict";

const utils = require('./utils.js');

// Stores transactions in a MerkleTree format.
// The tree will be perfectly balanced.
class MerkleTree {

  // Returns the size
  static calculateSize(numElems) {
    // Calculate a power of 2 at least as large as numElems.
    let n = 1;
    while (n < numElems) {
      n *= 2;
    }
    // We need almost double the space to hold the parent hashes.
    // E.g. if we have 8 transactions, we need to store their 8
    // hashes plus the 7 parent hashes.
    return (n * 2) - 1;
  }

  // Hashes from a node to the Merkle root, or until it does not have
  // the other half of the hash needed to continue to the root.
  static hashToRoot(hashes, i) {
    if (i === 0) return;
    let par = (i - 2) / 2;
    hashes[par] = utils.hash("" + hashes[i - 1] + "," + hashes[i]);

    // Test to see if we are the right subnode.  If so, we can hash
    // with the left subnode to continue one level up.
    if (par % 2 === 0) {
      this.hashToRoot(hashes, par);
    }
  }

  constructor(transactions) {
    // Actual transactions
    this.transactions = [];

    // Transaction hashes
    this.hashes = [];

    // hash-to-index Lookup table
    this.lookup = {};

    // We want to maintain a balanced tree, so we may need to pad
    // out the last few elements.
    let numBalancedTree = this.constructor.calculateSize(transactions.length);

    // Hashes of transactions start in the middle of the array.
    let firstTrans = Math.floor(numBalancedTree / 2);

    for (let i = firstTrans; i < numBalancedTree; i++) {
      let tNum = i - firstTrans;

      // If we have less than a power of 2 elements,
      // we pad out the transactions and arrays with the last element
      let v = tNum < transactions.length ? transactions[tNum].toString() : this.transactions[tNum - 1];
      let h = utils.hash(v);

      this.transactions[tNum] = v;
      this.hashes[i] = h;
      this.lookup[h] = i;
    }

    // Completing inner nodes of Merkle tree
    for (let i = firstTrans + 1; i < this.hashes.length; i += 2) {
      this.constructor.hashToRoot(this.hashes, i);
    }
  }

  // Returns the Merkle root
  get root() {
    return this.hashes[0];
  }

  getPath(transaction) {
    let h = utils.hash(transaction);
    let i = this.lookup[h];
    let path = { txInd: i };

    //
    // **YOUR CODE HERE**
    //
    // Starting at i, build up a path to the root, containing ONLY the nodes
    // needed to reconstruct the Merkle root.  Include their position in the
    // array so that a user who knows only the path and the Merkle root can
    // verify the path.

    if (i === 0) {
      return path
    }

    if (i > 0 && i % 2 === 0) {
      i = i - 1
      path[i] = this.hashes[i]
    } else if (i > 0 && i % 2 !== 0 && i < this.hashes.length - 1) {
      i = i + 1
      path[i] = this.hashes[i]
    } else {
      path[i] = this.hashes[i]
    }

    while (Math.floor((i + 1) / 2) - 1 > 0) {
      i % 2 === 0 ? i = i / 2 - 1 : i = Math.floor((i + 1) / 2) - 1

      i % 2 === 0 ? i = i - 1 : i = i + 1

      path[i] = this.hashes[i]
    }

    path[0] = this.hashes[0]

    return path;
  }

  // Return true if the tx matches the path.
  verify(tx, path) {
    let i = path.txInd;
    let h = utils.hash(tx);

    if (i === 0) {
      return this.hashes[0] === h
    }

    let hash
    let parent

    if (i > 0 && i % 2 === 0) {
      i = i - 1
    } else if (i > 0 && i % 2 !== 0 && i < this.hashes.length - 1) {
      i = i + 1
    }

    if (i % 2 === 0) {
      parent = i / 2 - 1
      hash = utils.hash("" + h + "," + path[i])
    } else {
      parent = Math.floor((i + 1) / 2) - 1
      hash = utils.hash("" + path[i] + "," + h)
    }

    if (this.hashes[parent] === hash) {
      h = this.hashes[parent]

      i = parent

      i % 2 === 0 ? i = i - 1 : i = i + 1
    } else {
      console.log("hashes don't match at " + i + " " + h + " " + path[i])
      return false
    }

    while (i >= 0) {
      if (i === 0) {
        return this.hashes[0] === hash
      }

      if (i % 2 === 0) {
        parent = i / 2 - 1
        hash = utils.hash("" + h + "," + path[i])
      } else {
        parent = Math.floor((i + 1) / 2) - 1
        hash = utils.hash("" + path[i] + "," + h)
      }

      if (this.hashes[parent] === hash) {
        h = this.hashes[parent]
        i = parent
        i % 2 === 0 ? i = i - 1 : i = i + 1
      } else {
        console.log("hashes don't match at " + i + " " + h + " " + path[i])
        return false
      }
    }

    return true
  }

  // Returns a boolean indicating whether this node is part
  // of the Merkle tree.
  contains(t) {
    let h = utils.hash(t);
    return this.lookup[h] !== undefined;
  }

  // Method to print out the tree, one line per level of the tree.
  // Note that hashes are truncated to 6 characters for the sake
  // of brevity.
  display() {
    let i = 0;
    let nextRow = 0;
    let s = "";

    console.log();

    while (i < this.hashes.length) {
      // Truncating hashes for the sake of readability
      s += this.hashes[i].slice(0, 6) + " ";
      if (i === nextRow) {
        console.log(s);
        s = "";
        nextRow = (nextRow + 1) * 2;
      }
      i++;
    }
  }
}


exports.MerkleTree = MerkleTree;

// 1) Passed an object, then txInd for the starting point
// Calculate “uncle” node’s index
// Hash the current result with the hash provided by uncle node
// When you reach the root, verify that you have a match.

// 2) Use an array(or maybe arrays) containing a) the hashes required on the Merkle path in the order that you need them
// b) the starting index
//i = (i%2) ? i/2-1 : Math.floow((i+1) / 2) - 1;