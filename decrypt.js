// decrypt.js

const sodium = require('sodium-native')

let key = Buffer.from(process.argv[2], 'hex')

let nonce = Buffer.from(process.argv[3], 'hex')

let ciphertext = Buffer.from(process.argv[4], 'hex')

let plaintext = Buffer.alloc(ciphertext.length - sodium.crypto_secretbox_MACBYTES)

if (!sodium.crypto_secretbox_open_easy(plaintext, ciphertext, nonce, key)) {
      console.log('Decryption failed!')
} else {
      console.log('Decrypted message:', plaintext.toString('ascii'))
}

