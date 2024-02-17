"use strict";

const SHOW = "SHOW_PRICE";
const UPDATE = "UPDATE_USD_PRICE";

let fs = require('fs');
let EventEmitter = require('events');

function readJsonFromFile(fileName) {
  // ***YOUR CODE HERE***
  //
  // Read from the specified file (using the fs module),
  // pass the contents to JSON.parse, and return the
  // resulting object.

  if (!fs.existsSync(fileName)) { throw new Error(`File not found: ${fileName}`); }

  try {
    let data = fs.readFileSync(fileName);
    let rates = JSON.parse(data);
    return rates
  } catch (e) {
    throw new Error("***FIXME***  readJsonFromFile not implemented.");
  }
}

class CurrencyConverter extends EventEmitter {

  static calculateRates(usdPrices) {
    let rates = {};
    for (let i in usdPrices) {
      let o = usdPrices[i];
      let sym = o['asset_id_quote'];
      let usdRate = o['rate'];

      rates[`USD-${sym}`] = usdRate;
      rates[`${sym}-USD`] = 1 / usdRate;

      for (let j in usdPrices) {
        if (i === j) {
          continue
        }

        let o2 = usdPrices[j];
        let sym2 = o2['asset_id_quote'];
        let usdRate2 = o2['rate'];

        rates[`${sym}-${sym2}`] = usdRate2 / usdRate;
        rates[`${sym2}-${sym}`] = usdRate / usdRate2;
      }

      // ***YOUR CODE HERE***
      //
      // Now that you have the price of the cryptocurrency in USD,
      // set the rates for trading different cryptocurrencies directly,
      // calculating the relative prices based off of their USD prices.
      //
      // For example, if `sym` is "BTC", calculate the values for
      // "BTC-ETH", "ETH-BTC", "BTC-EOS", "EOS-BTC", etc.

    }
    return rates;
  }

  // Prices must be in terms of USD.
  // Filter out date property.
  constructor(coin2USD) {
    super();
    this.rates = this.constructor.calculateRates(coin2USD.rates);

    this.on(SHOW, (o) => {
      // ***YOUR CODE HERE***
      //
      // Given an amount of 1 coin, print out what the equivalent
      // amount of a different coin would be.
      // Sample 'emit' events are given at the end of this file.
      let from = o.from;
      let to = o.to;
      let rate = this.rates[`${from}-${to}`];
      if (rate === undefined) {
        throw new Error(`Rate for ${from}-${to} not found`);
      }
      console.log(`1 ${from} = ${rate} ${to}`);
    });

    // ***YOUR CODE HERE***
    //
    // Add another event handler for the UPDATE event.
    // A sample invocation is given towards the end of this file.
    this.on(UPDATE, (o) => {
      let sym = o.sym;
      let usdPrice = o.usdPrice;
      this.rates[`USD-${sym}`] = usdPrice;
      this.rates[`${sym}-USD`] = 1 / usdPrice;
    });
  }

  convert(amount, fromUnits, toUnits) {
    let tag = `${fromUnits}-${toUnits}`;
    let rate = this.rates[tag];
    if (rate === undefined) {
      throw new Error(`Rate for ${tag} not found`);
    }
    return rate * amount;
  }

}

// All prices listed are in USD
let cnv = new CurrencyConverter(readJsonFromFile('./rates.json'));

console.log(cnv.rates);


// Uncomment the following lines when you have the first part of the lab working.
console.log();

function test(amt, from, to) {
  console.log(`${amt} ${from} is worth ${cnv.convert(amt, from, to)} ${to}.`);
}


test(4000, 'ETH', 'BTC');
test(200, 'BTC', 'EOS');




// Uncomment to test the third part of the lab

cnv.emit(SHOW, {from: "EOS", to: "BTC"});
cnv.emit(SHOW, {from: "EOS", to: "ETH"});
cnv.emit(SHOW, {from: "ETC", to: "ETH"});

cnv.emit(SHOW, {from: "LTC", to: "BTC"});

cnv.emit(UPDATE, {sym: "BTC", usdPrice: 50000});

cnv.emit(SHOW, {from: "LTC", to: "BTC"});

