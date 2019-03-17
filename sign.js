// sign.js 
const sodium = require('sodium-native');
const fs = require('fs');
let message = Buffer.from(process.argv[2]);

try {
    var keyPair = JSON.parse(fs.readFileSync('keys.txt'));
    var publicKey = Buffer.from(keyPair.publicKey, 'hex');
    var secretKey = Buffer.from(keyPair.secretKey, 'hex');

} catch {
    var publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
    var secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);
    sodium.crypto_sign_keypair(publicKey, secretKey);
    var keyPair = {
        secretKey: secretKey.toString('hex'), 
        publicKey: publicKey.toString('hex')
    }
    fs.writeFileSync('keys.txt', JSON.stringify(keyPair, null, 2))
}


let signature = Buffer.alloc(sodium.crypto_sign_BYTES);

sodium.crypto_sign_detached(signature, message, secretKey)

console.log('Message: ' + message.toString('ascii'));
console.log('Public Key: ' + publicKey.toString('hex'));
console.log('Signature: ' + signature.toString('hex'));
