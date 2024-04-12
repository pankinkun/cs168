pragma solidity ^0.7;

contract Faucet {
  address payable owner;
    
  constructor() {
    owner = msg.sender;
  }
    
  // Give out ether to whoever wants it.
  function withdraw(uint amt) public {
    require(amt <= 0.1 ether, "Don't be greedy.");
    // msg - the transaction
    // sender - the account initiating the tx
    // transfer -- built in fun.
    msg.sender.transfer(amt);
  }

  function getBalance() view public returns (uint) {
    return address(this).balance;
  }
  
  function destroy() public {
    require(msg.sender == owner, "Not yours to destroy.");
    selfdestruct(owner);
  }

  // This function accepts ether and does nothing else.
  //
  // A receive function could be used instead to accept incoming funds.
  // However, that is awkward to work with using the JS VM.
  function donate() external payable {}
}

