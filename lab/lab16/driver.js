const fs = require('fs');

const opcodes = require('./op-codes.js').opcodes;
const GleamVirtualMachine = require('./gleam.js').GleamVirtualMachine;

/**
 * Takes in a byte and returns a hexadecimal string.
 * 
 * @param {Number} n - A number in the range of 0-255.
 * 
 * @returns {string} - The number as a hexadecimal string.
 */
function toByteString(n) {
  let s = Number(n).toString(16);
  if (s.length < 2) {
    return '0' + s;
  } else {
    return s;
  }
}

/**
 * Builds up a mapping of opcode mnemonics to the corresponding
 * hexadecimal values.
 * 
 * @returns An object mapping opcode mnemonics to their hex value.
 */
function buildMnemonicLookup() {
  let lookupTable = {};
  Object.keys(opcodes).forEach((opcode) => {
    let inst = opcodes[opcode];
    lookupTable[inst.mnemonic] = toByteString(opcode);
  });
  return lookupTable;
}

/**
 * Translates a text file of opcode mnemonics to a buffer of bytecode.
 * 
 * @param {File} instructions - A file of the opcodes in hex format.
 *
 * @returns {Buffer} - A buffer of the bytecode instructions.
 */
function translate(instructions) {
  let lookupTable = buildMnemonicLookup();
  let contents = fs.readFileSync(instructions, 'utf8');
  let output = "";
  let lines = contents.trim().split('\n');
  lines.forEach((ln) => {
    // Skip comment lines and empty lines.
    if (ln.startsWith("//") || ln.match(/^\s*$/)) {
      return;
    }
    ln.split(' ').forEach((v) => {
      let byte = lookupTable[v];
      output += byte!==undefined ? byte : toByteString(v);
    });
  });
  return output;
}

// Handling command line arguments.
if (process.argv0 === 'node') {
  process.argv.shift();
}
if (process.argv.length < 2 || process.argv.length > 3) {
  console.log("driver.js <gleam file> [<gas amount>]");
  process.exit(1);
}

let inputFile = process.argv[1];

// If gas is not specified, it is 0.
let gasAmount = process.argv[2] || 0;

// The outputFile name is the same as the .gleam file name,
// but with a .byco extension.
let outputFile = inputFile.replace(/.gleam\b/, ".byco");

let byteString = translate(inputFile);
fs.writeFileSync(outputFile, byteString);

//console.log(byteString);

let gvm = new GleamVirtualMachine();

gvm.evaluate(outputFile, gasAmount);
