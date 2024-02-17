"use strict";

let crypto = require('crypto');

function encryptString(s, key, iv) {
  let cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let ctext = cipher.update(s, 'utf8', 'hex');
  ctext += cipher.final('hex');
  return ctext;
}

function decryptString(ctext, key, iv) {
  let decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let ptext = decipher.update(ctext, 'hex', 'utf8');
  ptext += decipher.final('utf8');
  return ptext;
}

let ptext = 'hello world';

let key = crypto.generateKeySync('aes', { length: 256});
let iv = crypto.randomBytes(16);


let ctext = encryptString(ptext, key, iv);

console.log(ctext);

let p2 = decryptString(ctext, key, iv);

console.log(p2);

