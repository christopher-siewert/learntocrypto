// sign.js 
const sodium = require('sodium-native');

let message = Buffer.from(process.argv[2]);
let publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
let secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);
let signature = Buffer.alloc(sodium.crypto_sign_BYTES);

sodium.crypto_sign_keypair(publicKey, secretKey);

sodium.crypto_sign_detached(signature, message, secretKey)

console.log('Message: ' + message.toString('ascii'));
console.log('Public Key: ' + publicKey.toString('hex'));
console.log('Signature: ' + signature.toString('hex'));
