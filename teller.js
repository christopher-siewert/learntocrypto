// teller.js
var jsonStream = require('duplex-json-stream')
var net = require('net')
var sodium = require('sodium-native')
var fs = require('fs')

let command = process.argv[2]
let customerId = process.argv[3]
let amount = process.argv[4]

var client = jsonStream(net.connect(3876))

client.on('data', function (msg) {
    console.log('Teller received:', msg)
    
    // msg is array, 0 is log entry and 1 is hash of last message
    // if hash is passed
    if (msg[1]) {
        // saves last message hash to file depending on customerId
        let filename = customerId + "-lastHash.txt" 
        fs.writeFileSync(filename, JSON.stringify({hash: msg[1]})) 
    }
})


// User specifies a customerID, which is then used to either create
// or look up key pair
// bank.js recieves pub key as customerId
// publicKey and secretKey are buffers
let {publicKey, secretKey} = keyPair(customerId)

// ID is string version of pubkey buffer
let ID = publicKey.toString('hex')

// Try to load last hash from file
try {
    let filename = customerId + "-lastHash.txt"
    // var for function scope
    var lastHash = JSON.parse(fs.readFileSync(filename)).hash
} catch { // If there is no file, use genesis hash of zeros
    var lastHash = Buffer.alloc(32).toString('hex')
}

// declare entry
let entry

// switch to decide entry depending on command
switch (command) {
    case 'balance':
        entry = {cmd: 'balance', customerId: ID, lastHash}
    	break
    case 'deposit':
	    entry = {cmd: 'deposit', amount, customerId: ID, lastHash}
    	break
    case 'withdraw':
	    entry = {cmd: 'withdraw', amount, customerId: ID, lastHash}
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
    
        var publicKey = sodium.sodium_malloc(sodium.crypto_sign_PUBLICKEYBYTES)
        var secretKey = sodium.sodium_malloc(sodium.crypto_sign_SECRETKEYBYTES)
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
    let signature = sodium.sodium_malloc(sodium.crypto_sign_BYTES)
    let message = Buffer.from(m)
    sodium.crypto_sign_detached(signature, message, secretKey)
    return signature.toString('hex')
}
