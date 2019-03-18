// encrypt.js 
const sodium = require('sodium-native')

let key = Buffer.from(process.argv[2], 'hex')

let nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
sodium.randombytes_buf(nonce)

let message = Buffer.from(process.argv[3])

let ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)

sodium.crypto_secretbox_easy(ciphertext, message, nonce, key)

console.log('Encrypted message:', ciphertext.toString('hex'))
console.log('Nonce:', nonce.toString('hex'))


