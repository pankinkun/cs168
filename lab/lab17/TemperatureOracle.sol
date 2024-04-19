// SPDX-License-Identifier: MIT
pragma solidity ^0.7;

/**
 * This contract represents an oracle for temperature information.
 * We trust that the creator of the oracle is posting accurate
 * information, but once posted, we don't have to worry that anyone
 * has changed that information, or that anyone except the trusted
 * source has posted it.
 */
contract TemperatureOracle {
    address authorized;
 
    // Mapping of zip codes to temperatures
    mapping (uint32 => int16) temperatureForZipcode;

    constructor() {
        authorized = msg.sender;
    }

    //
    // **YOUR CODE HERE**
    //
    // Add functions to get and to update the temperature.
    // Only the authorized address should be allowed to report a temperature.
    //

    function get(uint32 zipCode) view public returns (int16) {
        return temperatureForZipcode[zipCode];
    }

    function update(int16 temp, uint32 zipCode) public {
        require (authorized == msg.sender);

        temperatureForZipcode[zipCode] = temp;
    }
}