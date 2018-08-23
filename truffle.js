const HDWalletProvider = require('truffle-hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // Match any network id
    },
    rinkeby: {
      provider: new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_ENDPOINT),
      network_id: 4
    }
  }
};
