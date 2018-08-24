# Bounty System Dapp
This system is a distributed app for a bounty system. It uses IPFS for file/metadata storage and the blockchain for permissions and state management. Is also uses an EIP20 token for payments. The following user stories are implemented:

### User Submits Bounty
A user may submit a bounty for some work to be done. They may set an name, a sort description, and an amount. The bounty name, amount, and description is then saved to ipfs. The bounty and the amount is then also saved on the blockchain, and the bounty amount is escrowed from the submitter account.

### User Lists Bounties
Bounties are public information.

### User Adds Submission to Bounty
Any user can add submissions to bounties as long as they do not


# Set Up
* We assume that you have git and ipfs already installed.
* This will use Metamask for web3 if available, otherwise it will initialize its own for localhost:8485. See [src/application.js](src/application.js)


## Node version
You need a newer version of nodejs than the one shipped with Ubuntu 16.04 for this project to run. I recommend you use [nvm](https://github.com/creationix/nvm) to manage different node versions.

###
```
nvm install 8.7.0
nvm use 8.7.0
```

### Dependencies
```
$ npm install && npm install -g truffle ganache-cli
$ truffle install
$ truffle compile

$ ipfs init
$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'
$ ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000"]'
```


### Running
```
# run in separate terminals:
ipfs daemon
ganache-cli
truffle migrate && npm start
```
Then navigate to [localhost:3000](http://localhost:3000).

### Testing
Tests have been developed to test the happy case (create bounty -> create submission -> approve submission), as well as different boundary conditions and failure scenarios, including:
* Trying to create a bounty with an already existing id
* Trying to create a bounty when contract is paused.
* Trying to create a submission for an already existing submission
* Trying to create a submission for a non-existent bounty.
* Trying to create a submission when contract is paused.
* Trying to create a submission for a bounty which already has an accepted submission.
* Trying to accept/reject a submission for a bounty you don't own.
* Trying to accept/reject a submission which is already accepted/rejected.
* Trying to accept/reject a submission when the bounty already has an accepted submission.
* Trying to accept/reject a submission when contract is paused.
* Trying to emergency stop/resume contract when not contract owner.
```
truffle test
```

### Design Patterns
See [design_pattern_decisions.md](design_pattern_decisions.md) for an explanation of design patterns used.

### Security Tools / Common Attacks
See [avoiding_common_attacks.md](avoiding_common_attacks.md) for an explanation of common attacks and how they were avoided.


### Stretch Requirements Fulfilled
* Used IPFS
* Deloyed contract to rinkeby testnet
