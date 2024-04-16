'use strict';

let opcodes = {
  0x01: { mnemonic: 'ADD', gas: 3, evaluate: (vm) => {
    let v1 = vm.stack.pop();
    let v2 = vm.stack.pop();
    vm.stack.push(v1+v2);
  }},
  0x02: { mnemonic: 'MUL', gas: 5, evaluate: (vm) => {
    //
    // ***YOUR CODE HERE***
    //
    // For multiplication, pop the top 2 arguments off of
    // the stack, multiply them together, and push the
    // result back on to the stack.
    //
  }},
  0x60: { mnemonic: 'PUSH1', gas: 3, evaluate: (vm) => {
    // The next byte is data, not another instruction
    vm.pc++;
    let v = vm.bytecode.readUInt8(vm.pc);
    vm.stack.push(v);
  }},
  0x0c: { mnemonic: 'PRINT', gas: 0, evaluate: (vm) => {
    // **NOTE**: This is not a real EVM opcode.
    console.log(vm.stack.pop());
  }},
};

exports.opcodes = opcodes;
