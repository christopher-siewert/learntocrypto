// bank.js
const jsonStream = require('duplex-json-stream')
const net = require('net')
const fs = require('fs')
const sodium = require('sodium-native');

const genesisHash = Buffer.alloc(32).toString('hex');

var log = JSON.parse(fs.readFileSync("log.txt")); 

if (!verifyLog()) {
    console.log("The transaction log has been modified.");
    process.exit(1);
}

var server = net.createServer(function (socket) {
    socket = jsonStream(socket)
    socket.on('data', function (msg) {
        console.log('Bank received:', msg)
        switch (msg.cmd) {
            case 'balance':
                socket.write({cmd: 'balance', balance: getBalance()});
                break;
            case 'deposit':
                appendToLog(msg);
                socket.write(msg);
                break;
            case 'withdraw':
                if (getBalance() >= msg.amount) {
                    appendToLog(msg);
                    socket.write(msg);
                } else {
                    socket.write("Insufficient funds.");
                }
                break;
        }
        fs.writeFileSync("log.txt", JSON.stringify(log, null, 4))
    })
})

server.listen(3876);

function hashToHex(string) {
    let buf1 = Buffer.from(string);
    let buf2 = Buffer.alloc(sodium.crypto_generichash_BYTES);
    sodium.crypto_generichash(buf2, buf1);
    return buf2.toString('hex');
}

function getBalance() {
    return log.reduce((sum, entry) => {
        if (entry.value.cmd == 'deposit') {
            return sum + parseInt(entry.value.amount);
        } else if (entry.value.cmd == 'withdraw') {
            return sum - parseInt(entry.value.amount); 
        }
    }, 0)
}


function appendToLog(entry) {
    var prevHash = log.length ? log[log.length - 1].hash : genesisHash;
    log.push({
        value: entry,
        hash: hashToHex(prevHash + JSON.stringify(entry))
    });
}

function verifyLog() {
    var verify = true
    var prevHash = genesisHash
    for (var i = 0; i < log.length; i++) {
        if (hashToHex(prevHash + JSON.stringify(log[i].value)) != log[i].hash) {
            verify = false
        }
        prevHash = log[i].hash
    }
    return verify;
}
