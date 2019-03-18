# learntocrypto
7gate academy homework from https://github.com/sodium-friends/learntocrypto/tree/master/problems

Instructions for use:
--

Start the bank with `node bank`

Start the client in a seperate termminal with `node teller`

The teller takes command line arguments, but does not do error checking so be careful.

There are three commands:
1. `deposit`
2. `withdraw`
3. `balance`

The format for teller commands is `node teller commandName customerID amount`.

So to check the balance of customer 1, you would type `node teller balance 1`.
And to deposit 20 into customer 5's account you would type `node teller deposit 5 20`.
Only unsigned ints have been tested

The bank's asymmetric keys are stored in keyPair.txt, symmetric key is stored in key.txt, and each client's asymmetric keys are stored in customerID.txt.

In order to prevent replay attacks the teller stores the customer's last transaction hash in customerID-lastHash.txt 


