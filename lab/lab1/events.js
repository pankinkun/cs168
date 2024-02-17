"use strict";
let EventEmitter = require('events');
let ee = new EventEmitter();
let dead = false;
ee.on('die', function() {
  console.log("I'm melting!!!");
  dead = true;
});
setTimeout(function() {
  ee.emit('die');
}, 100);
while (!dead) {}
console.log('done');

