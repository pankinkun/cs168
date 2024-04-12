pragma solidity ^0.7;

// A distributed lottery game (with some flaws).
contract Lottery {
    // Constants related to the betting rules.
    uint256 constant BET_AMT = 0.2 ether;
    uint8 constant NUM_BETS = 3;
    
    // Running total, used to select the winner of the lottery.
    uint total;
    
    constructor() {
        //
        // *** YOUR CODE HERE ***
        //
        // You may need to add extra variables to the contract
        // in order to get this assignment working.
        total = 0;
    }
    
    // Destructor -- The winner calls this to collect his earnings.
    function destroy() external {
        //
        // *** YOUR CODE HERE ***
        //
        // Verify that betting is finished, and that the caller
        // is the winner.  If so, call selfdestruct with the winner's
        // address to claim the funds.
    }
    
    // A player bets and is registered for the game.
    // Each player must choose a number.
    // When the last player bets, the winner is determined.
    function bet(uint n) payable external {
        //
        // *** YOUR CODE HERE ***
        //
        // Ensure that the caller has bet exactly BET_AMT
        // and that bets can still be taken.
        // If so, track the caller's key and add their selected
        // number 'n' to the total.
        //
        // If this call is the last bet, select the winner
        // by modding the total by the number of players.
    }

    // Show who won the bet.
    function showWinner() external view returns(address) {
        //
        // *** YOUR CODE HERE ***
        //
        // Ensure that the betting has concluded before this
        // function is called.  If so, return the address
        // of the selected winner.
    }

}

