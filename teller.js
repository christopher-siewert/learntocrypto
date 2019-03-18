// teller.js
var jsonStream = require('duplex-json-stream')
var net = require('net')
var sodium = require('sodium-native')
var fs = require('fs')


var client = jsonStream(net.connect(3876))

client.on('data', function (msg) {
    console.log('Teller received:', msg)
})

let command = process.argv[2]
let customerId = process.argv[3]
let amount = process.argv[4]

// User specifies a customerID, which is then used to either create
// or look up key pair
// bank.js recieves pub key as customerId
// publicKey and secretKey are buffers
let {publicKey, secretKey} = keyPair(customerId)

// ID is string version of pubkey buffer
let ID = publicKey.toString('hex')

// declare entry
let entry

// switch to decide entry depending on command
switch (command) {
    case 'balance':
        entry = {cmd: 'balance', customerId: ID}
    	break
    case 'deposit':
	    entry = {cmd: 'deposit', amount, customerId: ID}
    	break
    case 'withdraw':
	    entry = {cmd: 'withdraw', amount, customerId: ID}
	    break
    default:
	    break		
}

// sign stringifyed entry
let signature = sign(JSON.stringify(entry)) 

// send entry and signature to bank
client.end({entry, signature}) 


function keyPair(ID) {

    // Try loading a public/private key pair from ID.txt
    // Declared with var for function scope
    var filename = ID + '.txt'
    try {
        var keyPair = JSON.parse(fs.readFileSync(filename))
        var publicKey = Buffer.from(keyPair.publicKey, 'hex')
        var secretKey = Buffer.from(keyPair.secretKey, 'hex')
    
    } catch { // If ID.txt doesn't exist, create a new key pair and store to file
    
        var publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
        var secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
        sodium.crypto_sign_keypair(publicKey, secretKey)
        var keyPair = {
            secretKey: secretKey.toString('hex'),
            publicKey: publicKey.toString('hex')
        }
        
        fs.writeFileSync(filename, JSON.stringify(keyPair, null, 2))
    }
    // return object with both buffers
    return {publicKey, secretKey}
}

// takes a message string and signs it with the current secretKey
// returns string
function sign(m) {
    let signature = Buffer.alloc(sodium.crypto_sign_BYTES)
    let message = Buffer.from(m)
    sodium.crypto_sign_detached(signature, message, secretKey)
    return signature.toString('hex')
}
