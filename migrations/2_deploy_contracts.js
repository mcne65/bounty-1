const Bounty = artifacts.require('./Bounty.sol');
const BountyLib = artifacts.require('./BountyLib.sol');
const SubmissionLib = artifacts.require('./SubmissionLib.sol');
module.exports = (deployer) => {
  deployer.deploy(BountyLib);
  deployer.deploy(SubmissionLib);
  deployer.link(BountyLib, Bounty);
  deployer.link(SubmissionLib, Bounty);
  deployer.deploy(Bounty);
};
