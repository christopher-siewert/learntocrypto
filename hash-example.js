// hash-example.js 
const sodium = require('sodium-native');

let buf1 = Buffer.from('Hello, World!');
let buf2 = Buffer.alloc(sodium.crypto_generichash_BYTES);

sodium.crypto_generichash(buf2, buf1);

console.log(buf2.toString('hex'));
