"use strict";

const fs = require('fs');
const Web3 = require('web3');

// Default parameters for calling Ethereum
const GAS = 1500000;
const GAS_PRICE_IN_ETH = '0.00003';
const URL = "http://localhost:8545";
const CONTRACT_NAME = "SpartanPyrite_sol_SpartanPyrite";

/**
 * Node interface for the SpartanPyrite token.
 */
module.exports = class SpartanPyrite {

  /**
   * The constructor for the SpartanPyrite interface.  If the contract has been
   * deployed previously, the address can be specified.
   * 
   * @constructor
   * @param {Object} [config] - The configuration details of this interface.
   * @param {String} [config.contractAddress] - The address of a contract that has been deployed.
   * @param {String} [config.contractName] - The name of the bin/abi files, without extensions. 
   * @param {String} [config.url] - The URL that Ganache is listening to.
   */
  constructor({ contractAddress, contractName = CONTRACT_NAME, url = URL } = {}) {
    this.contractName = contractName
    this.url = url;
    this.web3 = new Web3(this.url);

    // If a contract address has been specified, the ABI file can be specified.
    // Otherwise, deploy needs to be called.
    if (contractAddress) {
      let abi = JSON.parse(fs.readFileSync(`${this.contractName}.abi`).toString());
      this.contract = new this.web3.eth.Contract(abi);
      this.contract.options.address = contractAddress;
    }
  }

  /**
   * Deploys the smart contract to Ganache.
   * 
   * @param {String} from - The address paying to deploy the contract.
   * @param {Number} [gas] - The maximum amount of gas to spend deploying the contract.
   * @param {Number} [gasPrice] - The ETH paid per unit of gas.
   * 
   * @returns {Promise}
   */
  deploy(from, gas = GAS, gasPrice = GAS_PRICE_IN_ETH) {
    let bytecode = fs.readFileSync(`${this.contractName}.bin`).toString();
    let abi = JSON.parse(fs.readFileSync(`${this.contractName}.abi`).toString());

    this.contract = new this.web3.eth.Contract(abi);

    // Deploying the contract -- this uses JS's promises API.
    // We assume that there are no arguments to the constructor.
    // If there are, you would need to pass them to the arguments
    // property of the object passed to 'deploy'.
    return this.contract.deploy({
      data: bytecode,
      arguments: []
    }).send({
      from: from,
      gas: gas,
      gasPrice: this.web3.utils.toWei(gasPrice, 'ether')
    }).then((newContractInstance) => {
      let contractAddress = newContractInstance.options.address;
      this.contract.options.address = contractAddress;
      console.log(`Contract address: ${contractAddress}`);
    });
  }

  /**
   * Calls the Ethereum smart contract to transfer SPYR tokens
   * to another account.  Note that the 'from' address pays for
   * the transaction.
   * 
   * @param {String} from - Ethereum address sending the tokens.
   * @param {String} to - Ethereum address receiving the tokens.
   * @param {Number} amt - Amount of tokens being transferred.
   * 
   * @returns {Promise}
   */
  transfer(from, to, amt) {
    return this.contract.methods.transfer(to, amt).send({
      from: from,
    });
  }

  /**
   * Calls the Ethereum smart contract to burn SPYR tokens.
   * Note that this method requires gas.
   * 
   * @param {String} - ethAddr Ethereum address owning SPYR tokens.
   * @param {Number} - amtEth Amount of ether to burn.
   * 
   * @returns {Promise}
   */
  burn(ethAddr, amtEth) {
    //
    // **YOUR CODE HERE**
    //

    this.contract.methods.burn(amtEth).send({
      from: ethAddr,
    });
  }

  /**
   * Calls the Ethereum smart contract to get the amount of SPYR
   * tokens burned by the specified account.  Calling this function
   * does not consume any gas.
   * 
   * @param {String} ethAddr - Ethereum address that burned SPYR tokens.
   * 
   * @returns {Promise} - When fulfilled, returns the amount of SPYR tokens
   *    burned for this ETHR account.
   */
  getBurned(ethAddr) {
    return this.contract.methods.getBurnedAmount(ethAddr).call((_, amount) => {
      return amount;
    }); 
  }

  /**
   * Sets the SpartanGold address for the caller.
   * Note that calling this function consumes gas.
   * 
   * @param {String} ethAddr - Ethereum account of the caller.
   * @param {String} sgAddr - Base64 encoding of the caller's SpartanGold address.
   * 
   * @returns {Promise}
   */
  setSpartanGoldAddr(ethAddr, sgAddr) {
    //
    // **YOUR CODE HERE**
    //

    this.contract.methods.setSpartanGoldAddr(sgAddr).send({
      from: ethAddr,
    });
  }

  /**
   * Gets the SpartanGold address mapped to the specified Ethereum address.
   * This function does not consume gas.
   * 
   * @param {String} ethAddr - Ethereum address that burned SPYR tokens.
   * 
   * @returns {Promise} - When fulfilled, returns the Base64 encoding of
   *      the SpartanGold address corresponding to the specified Ethereum address.
   */
  getSpartanGoldAddr(ethAddr) {
    //
    // **YOUR CODE HERE**
    //

    this.contract.methods.getSpartanGoldAddr().call((_, sgAddr) => {
      return sgAddr;
    })
  }

  /**
   * Gets the SpartanGold address and the amount of SPYR burned by the specified
   * Ethereum address.  This function does not consume gas.
   * 
   * @param {String} ethAddr - Ethereum address that burned SPYR tokens.
   * 
   * @returns {Promise} - When fulfilled, returns a tuple of the Base64 encoding of
   *      the SpartanGold address corresponding to the specified Ethereum address
   *      and the amount of SPYR tokens burned by that address.
   */
  getBurnDetails(ethAddr) {
    //
    // **YOUR CODE HERE**
    //

    this.contract.methods.getBurnDetails().call((_, sgAddr, amt) => {
      return [sgAddr, amt];
    });
  }

  /**
   * Converts a base64 string to a hex string.
   * 
   * @param {String} base64str - Base64-encoded string.
   * 
   * @returns {String} - Hex-encoded string.
   */
  base64toHex(base64str) {
    let buff = Buffer.from(base64str, 'base64');
    return '0x' + buff.toString('hex');
  }

  /**
   * Converts a hex string to a base64 string.
   * 
   * @param {String} hexStr - Hex-encoded string.
   * @returns {String} - Base64-encoded string.
   */
  hexToBase64(hexStr) {
    // Need to chop off the '0x' at the beginning of the string.
    let buff = Buffer.from(hexStr.slice(2), 'hex');
    return buff.toString('base64');
  }

}
