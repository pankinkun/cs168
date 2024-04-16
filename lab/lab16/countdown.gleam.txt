// Store 10
PUSH1 10
PUSH1 0
MSTORE

/////// BEGIN LOOP ///////
JUMPDEST

// Print the current value
PUSH1 0
MLOAD
PRINT

// Subtract 1
PUSH1 1
PUSH1 0
MLOAD
SUB

// Store the result
PUSH1 0
MSTORE

// Repeat loop if not 0
PUSH1 0
MLOAD
PUSH1 5
JUMPI
/////// END LOOP ///////

// Print out the final result
PUSH1 0
MLOAD
PRINT
