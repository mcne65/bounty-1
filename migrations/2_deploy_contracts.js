const Bounty = artifacts.require('./Bounty.sol');
module.exports = async (deployer) => {
  return deployer.deploy(Bounty);
};
