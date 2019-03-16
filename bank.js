// bank.js
var jsonStream = require('duplex-json-stream')
var net = require('net')

var log = [
    {cmd: 'deposit', amount: 10},
    {cmd: 'deposit', amount: 20},
    {cmd: 'deposit', amount: 30},
    {cmd: 'withdraw', amount: 5}
];

var getBalance = () => {
    return log.reduce((sum, entry) => {
        if (entry.cmd == 'deposit') {
            return sum + parseInt(entry.amount);
        } else if (entry.cmd == 'withdraw') {
            return sum - parseInt(entry.amount); 
        }
    }, 0)
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
            case 'withdraw':
                if (getBalance() > msg.amount) {
                    log.push(msg);
                    socket.write(msg);
                } else {
                    socket.write("Insufficient funds.");
                }
                break;
        }
    })
})

server.listen(3876)
