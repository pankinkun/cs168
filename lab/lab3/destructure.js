"use strict";

/*
function foo() {
  return [1,"one"];
}

let [ n, s ] = foo();
console.log(n); // Prints '1'
console.log(s); // Prints 'one'
*/


function foo() {
  return { n: 1, s: "one" };
}

let { n, s } = foo();
console.log(n); // Prints '1'
console.log(s); // Prints 'one'



function bar({x, y}) {
  return x + y;
}

let o = {x: 3, y: 4};
let z = bar(o);

console.log(z);
