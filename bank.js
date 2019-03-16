// bank.js
var jsonStream = require('duplex-json-stream')
var net = require('net')

var log = [
    {cmd: 'deposit', amount: 130},
    {cmd: 'deposit', amount: 0},
    {cmd: 'deposit', amount: 120}
];

var getBalance = () => {
    return log.reduce((sum, current) => sum + parseInt(current.amount), 0);
};
    
var server = net.createServer(function (socket) {
    socket = jsonStream(socket)

    socket.on('data', function (msg) {
        console.log('Bank received:', msg)
        switch (msg.cmd) {
            case 'balance':
                socket.write({cmd: 'balance', balance: getBalance()});
                break;
            case 'deposit':
                log.push(msg);
                socket.write(msg);
                break;
        }
    })
})

server.listen(3876)
