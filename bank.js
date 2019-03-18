// bank.js
const jsonStream = require('duplex-json-stream')
const net = require('net')
const fs = require('fs')
const sodium = require('sodium-native')

// genesis hash to use for hash chain
const genesisHash = Buffer.alloc(32).toString('hex')

// Load asymmetric keys from file or create new keys
let {publicKey, secretKey} = keyPair()

// Load symmetric key from file or create new
let key = symKey()

// Load log from file and decyrpt
let log = decryptLog()

// If the hash chain isn't correct exit immediately
if (!verifyLog()) {
    console.log("The transaction log has been modified.")
    process.exit(1)
}

// Server code
let server = net.createServer(function (socket) {
    socket = jsonStream(socket)
    socket.on('data', function (msg) {
        console.log('Bank received:', msg)
        switch (msg.cmd) {
            case 'balance':
                socket.write({
                    cmd: 'balance', 
                    balance: getBalance(msg.customerId)
                })
                break
            case 'deposit':
                appendToLog(msg)
                socket.write(msg)
                break
            case 'withdraw':
                if (getBalance(msg.customerId) >= msg.amount) {
                    appendToLog(msg)
                    socket.write(msg)
                } else {
                    socket.write("Insufficient funds.")
                }
                break
            case 'register':
                break
            default:
                break
        }
        // Takes current log variable, encrypts and writes to file
        encryptAndWriteLog()
    })
})

server.listen(3876)

// Returns the hash of an input in hex
function hashToHex(string) {
    let buf1 = Buffer.from(string)
    let buf2 = Buffer.alloc(sodium.crypto_generichash_BYTES)
    sodium.crypto_generichash(buf2, buf1)
    return buf2.toString('hex')
}

// Loops through transaction log and totals up balance for one ID
function getBalance(ID) {
    return log.reduce((sum, entry) => {
        // If IDs match
        if (entry.value.customerId == ID) {
            // Add all deposits and minus all withdraws 
            if (entry.value.cmd == 'deposit') {
                return sum + parseInt(entry.value.amount)
            } else if (entry.value.cmd == 'withdraw') {
                return sum - parseInt(entry.value.amount) 
            }
        } else { // If IDs don't match, don't change sum
            return sum
        }
    }, 0) // 0 at end is to set initial sum to 0
}

// Adds entry to log array
function appendToLog(entry) {
    // Set prevhash to last entry's hash unless the log is empty
    // If empty set to genesis hash
    let prevHash = log.length ? log[log.length - 1].hash : genesisHash
    
    // Calc current chain hash
    let currentHash = hashToHex(prevHash + JSON.stringify(entry))

    // Sign hash using secret key
    let message = Buffer.from(currentHash, 'hex')
    let signature = Buffer.alloc(sodium.crypto_sign_BYTES)
    sodium.crypto_sign_detached(signature, message, secretKey)

    // Push the entry, chained hash and signature of hash
    log.push({
        value: entry,
        hash: currentHash,
        signature: signature.toString('hex')
    })
}

// Returns true if hash chain is unbroken and all sigs match
function verifyLog() {
    let verify = true
    let prevHash = genesisHash
    
    // For each log entry
    for (let i = 0; i < log.length; i++) {
        
        // If the calculated entry hash doesn't match the file set false
        if (hashToHex(prevHash + JSON.stringify(log[i].value)) != log[i].hash) {
            verify = false
        }
        
        // Set prevHash for next loop
        prevHash = log[i].hash

        // Buffers for sig verify
        let message = Buffer.from(log[i].hash, 'hex')
        let signature = Buffer.from(log[i].signature, 'hex')
        
        // If signature doesn't verify set false
        if (!sodium.crypto_sign_verify_detached(signature, message, publicKey)) {
            verify = false
        }
    }
    return verify
}

function keyPair() {

    // Try loading a public/private key pair from keys.txt
    // Declared with var for function scope
    try {
    
        var keyPair = JSON.parse(fs.readFileSync('keyPair.txt'))
        var publicKey = Buffer.from(keyPair.publicKey, 'hex')
        var secretKey = Buffer.from(keyPair.secretKey, 'hex')
    
    } catch { // If keys.txt doesn't exist, create a new key pair and store to file
        
        var publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
        var secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES)
        sodium.crypto_sign_keypair(publicKey, secretKey)
        var keyPair = {
            secretKey: secretKey.toString('hex'), 
            publicKey: publicKey.toString('hex')
        }
        fs.writeFileSync('keyPair.txt', JSON.stringify(keyPair, null, 2))
    }
    
    // return object with both buffers 
    return {publicKey, secretKey}
}

function symKey() {

    // Try loading a symetric encryption key from file.
    // Declared with var for function scope
    try {
        
        var key = Buffer.from(fs.readFileSync('key.txt'), 'hex')
    
    } catch { // If key.txt doesn't exist, create a new sym key and store it 
        
        var key = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES);
        sodium.randombytes_buf(key)
        
        fs.writeFileSync('key.txt', key.toString('hex'))
    }
    return key
}

function decryptLog() {
    
    // try loading and decrypting from log.txt, if it fails, log = empty array
    try {
    
        // Read transaction history
        let logObject = JSON.parse(fs.readFileSync("log.txt")) 
        
        // Decrypt log
        let nonce = Buffer.from(logObject.nonce, 'hex')
        let ciphertext = Buffer.from(logObject.ciphertext, 'hex')
        let plaintext = Buffer.alloc(ciphertext.length - sodium.crypto_secretbox_MACBYTES)

        if (!sodium.crypto_secretbox_open_easy(plaintext, ciphertext, nonce, key)) {
            console.log('Decryption of log failed!')
            process.exit(1)
        } else {
            return JSON.parse(plaintext.toString())   
        }
    
    } catch {
        return [] 
    }

}

function encryptAndWriteLog() {

    let nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES)
    sodium.randombytes_buf(nonce)
    let message = Buffer.from(JSON.stringify(log))
    let ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES)

    sodium.crypto_secretbox_easy(ciphertext, message, nonce, key)
    
    let logObject = {
        ciphertext: ciphertext.toString('hex'), 
        nonce: nonce.toString('hex')
    }
    
    fs.writeFileSync("log.txt", JSON.stringify(logObject, null, 2))

}
    
