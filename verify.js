// verify.js 
const sodium = require('sodium-native');

let message = Buffer.from(process.argv[2], 'ascii');
let publicKey = Buffer.from(process.argv[3], 'hex');
let signature = Buffer.from(process.argv[4], 'hex');


//let publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
//let signature = Buffer.alloc(sodium.crypto_sign_BYTES);

//publicKey.write(process.argv[3], 0, publicKey.length, 'hex');
//signature.write(process.argv[4], 0, signature.length, 'hex');

var bool = sodium.crypto_sign_verify_detached(signature, message, publicKey);

console.log(bool);
