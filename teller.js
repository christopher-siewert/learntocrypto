// teller.js
var jsonStream = require('duplex-json-stream')
var net = require('net')

var client = jsonStream(net.connect(3876))

client.on('data', function (msg) {
    console.log('Teller received:', msg)
})

switch (process.argv[2]) {
    case 'balance':
        client.end({cmd: 'balance'}); 
    	break;
    case 'deposit':
	client.end({cmd: 'deposit', amount: process.argv[3]});
    	break;
    default:
	break;		
}



