// secret-key.js 
const sodium = require('sodium-native');

let key = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES);

sodium.randombytes_buf(key)

console.log(key.toString('hex'));
