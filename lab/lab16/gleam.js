'use strict';

const fs = require('fs');
const opcodes = require('./op-codes.js').opcodes;

/**
 * GLEAM is the Gas-Limited EVM-like virtuAl Machine.
 */
class GleamVirtualMachine {

  /**
   * Initializes the virtual machine with the specified amount of
   * gas.  The stack and memory are both initially empty.
   * 
   * @param {Number} gas - Amount of gas the VM begins with.
   */
  constructor() {
    this.stack = [];
    this.memory = [];
  }

  /** 
   * Loads a bytecode file and returns an array of strings,
   * which are the commands within the file.
   */
  static loadBytecode(bytecodeFile) {
    let contents = fs.readFileSync(bytecodeFile, 'utf8');
    return Buffer.from(contents, 'hex')
  }

  /**
   * Evaluates the specified file, throwing an exception
   * if the gasLimit is exceeded.
   * 
   * YOUR JOB: Update the code to track gas usage and throw
   * the "Out of Gas" exception.
   */
  evaluate(bytecodeFile, gasLimit) {
    this.bytecode = this.constructor.loadBytecode(bytecodeFile);

    // Initializing the program counter to keep track of our
    // place within the program.
    this.pc = 0;

    //
    // ***YOUR CODE HERE***
    //
    // Create a counter for the amount of gas used,
    // initialized to 0.
    //

    while (this.pc < this.bytecode.length) {
      let opcode = this.bytecode.readUInt8(this.pc);
      let operation = opcodes[opcode];
      if (operation === undefined) {
        throw new Error(`Unable to find instruction for ${opcode}`);
      }
      operation.evaluate(this);

      //
      // ***YOUR CODE HERE***
      //
      // For every instruction, keep track of the amount of gas used.
      // One the amount of gas consumed exceeds gasLimit, throw an
      // error for "Out of gas".
      //

      this.pc++;
    }
  }
}

exports.GleamVirtualMachine = GleamVirtualMachine;
