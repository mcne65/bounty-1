pragma solidity ^0.4.23;

library BountyLib {
  struct Bounty {
    address owner;
    uint amount;
    bytes32[] submissionIds;
    bytes32 acceptedSubmissionId;
  }

  struct BountyStorage {
    bytes32[] bountyIds;
    mapping (bytes32 => Bounty) bounties;
  }

  modifier positive(uint amount) { require(amount > 0); _;}

  function newBounty(BountyStorage storage self, bytes32 bountyId, uint amount) positive(amount) internal {
    // bounty should not exist
    require(self.bounties[bountyId].owner == 0x0);

    self.bountyIds.push(bountyId);
    self.bounties[bountyId].owner = msg.sender;
    self.bounties[bountyId].amount = amount;
  }

  function addSubmission(BountyStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    self.bounties[bountyId].submissionIds.push(submissionId);
  }

  function acceptSubmission(BountyStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    self.bounties[bountyId].acceptedSubmissionId = submissionId;
  }

  function get(BountyStorage storage self, bytes32 bountyId) internal view returns (Bounty) {
    return self.bounties[bountyId];
  }
}
