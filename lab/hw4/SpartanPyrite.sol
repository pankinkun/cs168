// SPDX-License-Identifier: MPL-2.0

pragma solidity ^0.8;

import "./ERC20Interface.sol";

// ERC-20 token, used as a placeholder for SpartanGold.
// When owners of SpartanPyrite tokens burn them, they
// are entitled to an equal amount of SpartanGold coins.
// This approach is a common fundraising technique for
// cryptocurrency startups.
contract SpartanPyrite is ERC20Interface {

    string public constant symbol = "SPYR";
    string public constant name = "A placeholder for SpartanGold";
    uint8 public constant decimals = 18;  // 18 is the most common number of decimal places
    
    // The supply of tokens can be variable in ERC-20.
    // In SPYR, they can be burned, but not created.
    uint private totalTokens = 100000;

    // Balances of everyone's ERC-20 tokens.
    mapping(address => uint) private balances;
    
    // Specifies the allowed addresses for transfering funds.
    mapping(address => mapping (address => uint)) private allowances;

    // All tokens are initially given to the creator.
    constructor() {
        balances[msg.sender] = totalTokens;
    }
    
    // Returns the number of SpartanPyrite tokens currently in circulation.
    function totalSupply() public override view returns (uint) {
        return totalTokens;
    }

    // Returns the amount of SpartanPyrite tokens owned by the specified address.
    function balanceOf(address tokenOwner) public override view returns (uint) {
        return balances[tokenOwner];
    }
    
    // The caller transfers the specified amount of tokens to the specified address.
    function transfer(address to, uint amount) public override returns (bool) {
        if (amount<=0 || balances[msg.sender] < amount) {
            return false;
        }
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    // Authorize operator to withdraw 'amount' worth of tokens from the caller's account.
    function approve(address operator, uint amount) public override returns (bool) {
        require(amount > 0, "Amount must be positive.");
        allowances[msg.sender][operator] = amount;
        return true;
    }
    
    // Gives the amount of tokens that the operator is allowed to tranfer from the owner's account.
    function allowance(address tokenOwner, address operator) public override view returns (uint) {
        return allowances[tokenOwner][operator];
    }
    
    // Used by an operator to transfer tokens on behalf of another client.
    function transferFrom(address from, address to, uint amount) public override returns (bool) {
        if (amount <= 0 || balances[from] < amount || allowances[from][to] < amount) {
            return false;
        }
        balances[from] -= amount;
        allowances[from][to] -= amount;
        balances[to] += amount;
        return true;
    }
    
    // Destroys tokens, deducting them from the caller's account and
    // the count of total tokens.  The amount of tokens burned is recorded.
    function burn(uint amount) public {
        //
        // ***YOUR CODE HERE***
        //
        // Make sure that a client cannot burn more tokens than they possess.
        // Also, be sure to check for underflow.
        //
    }

    // Returns the total amount of tokens burned by the specified account
    function getBurnedAmount(address burner) public view returns (uint) {
        //
        // ***YOUR CODE HERE***
        //
    }

    // Sets the caller's SpartanGold address.
    function setSpartanGoldAddress(bytes32 sgAddr) public {
        //
        // ***YOUR CODE HERE***
        //
        // Note that 'bytes32' is how we are storing the string
        // Representing the client's SpartanGold address.
        //
    }

    // Gets the SpartanGold address associated with the specified Ethereum address.
    function getSpartanGoldAddress(address ethAddr) public view returns (bytes32) {
        //
        // ***YOUR CODE HERE***
        //
    }

    // Gets both the SpartanGold address and the **total** amount of burned tokens
    // associated with the specified Ethereum address.
    function getBurnDetails(address ethAddr) public view returns (bytes32, uint) {
        //
        // ***YOUR CODE HERE***
        //
    }
}
