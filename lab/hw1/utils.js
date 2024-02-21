"use strict";

const crypto = require('crypto');

const HASH_ALG = 'sha256';
const SIG_ALG = 'RSA-SHA256';

const MAX_RANGE = 256;
const SESSION_RANGE = 100000;


// Returns 2 buffers of equal size, 'ciphertext' and 'key'
exports.makeOTP = function({string, buffer}) {
  if ((!string && !buffer) || (!!string && !!buffer)) {
    console.log(string);
    console.log(buffer);
    throw new Error("Either string or buffer should be specified, but not both");
  }
  // If a string was specified, convert it to a buffer.
  if (string) {
    buffer = Buffer.from(string);
  }
  let key = crypto.randomBytes(buffer.length);
  let ciphertext = Buffer.alloc(buffer.length);
  for (let i=0; i<buffer.length; i++) {
    ciphertext[i] = buffer[i] ^ key[i];
    //console.log(`${ciphertext[i]} = ${buffer[i]} ^ ${key[i]}`);
  }
  return { key, ciphertext };
};

// XORs the key with the ciphertext.  By default, this function
// returns a buffer, but 'string' or 'buffer' may be specified.
exports.decryptOTP = function({key, ciphertext, returnType}) {
  if (key.length !== ciphertext.length) {
    throw new Error("The length of the key must match the length of the ciphertext.");
  }
  let p = Buffer.alloc(key.length);
  for (let i=0; i<key.length; i++) {
    p[i] = key[i] ^ ciphertext[i];
  }
  if (!returnType || returnType === 'buffer') {
    return p;
  } else if (returnType === 'string') {
    return p.toString();
  } else {
    throw new Error(`${returnType} is not supported as a return type`);
  }
};

// Return a globally unique ID
exports.makeGUID = function() {
  return crypto.randomBytes(48).toString('hex');
};

// Returns the hash of a string.
exports.hash = function(s) {
  s = s.toString();
  return crypto.createHash(HASH_ALG).update(s).digest('hex');
};

// Returns a random number between 0 and 255.
exports.sample = function() {
  return crypto.randomBytes(1).readUInt8();
};

// Using rejection sampling,
// following http://dimitri.xyz/random-ints-from-random-bits/.
exports.randInt = function(range) {
  if (range > MAX_RANGE) {
    throw new Error(`Sorry, range cannot be more than ${MAX_RANGE}`);
  }

  // Calculating max allowable range
  let q = Math.floor(MAX_RANGE / range);
  let max = q * range;

  let n;
  do {
    n = exports.sample();
  } while (n >= max);
  return n % range;
};

exports.makeSessionID = function() {
  return exports.hash(exports.randInt(SESSION_RANGE));
};

exports.generateKeyPair = function() {
  const kp = crypto.generateKeyPairSync('rsa', {
    modulusLength: 512,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
  });
  return {
    public: kp.publicKey,
    private: kp.privateKey,
  };
};  

exports.sign = function(privKey, msg) {
  let signer = crypto.createSign(SIG_ALG);
  // Convert an object to its JSON representation
  let str = (msg === Object(msg)) ? JSON.stringify(msg) : ""+msg;
  return signer.update(str).sign(privKey, 'hex');
};

exports.verifySignature = function(pubKey, msg, sig) {
  let verifier = crypto.createVerify(SIG_ALG);
  // Convert an object to its JSON representation
  let str = (msg === Object(msg)) ? JSON.stringify(msg) : ""+msg;
  return verifier.update(str).verify(pubKey, sig, 'hex');
};

exports.deserializeBufferArray = function(buffArray) {
  let arr = [];
  buffArray.forEach((bufObj) => {
    arr.push(Buffer.from(bufObj.data));
  });
  return arr;
};
