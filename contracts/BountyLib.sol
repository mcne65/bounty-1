pragma solidity ^0.4.23;

library BountyLib {
  struct Bounty {
    address owner;
    uint amount;
    bytes32[] submissionIds;
    bytes32 acceptedSubmissionId;
    bytes32[] rejectedSubmissionIds;
  }

  struct BountyStorage {
    bytes32[] bountyIds;
    mapping (bytes32 => Bounty) bounties;
  }

  /** @dev Creates a new bounty.
  * @param self bounty storage.
  * @param bountyId id of bounty.
  * @param amount amount.
  */
  function newBounty(BountyStorage storage self, bytes32 bountyId, uint amount) internal {
    require(self.bounties[bountyId].owner == 0x0, "A bounty with this id already exists");
    require(self.bountyIds.length + 1 > self.bountyIds.length, "Unable to add bounty - too many bounties.");

    self.bountyIds.push(bountyId);
    self.bounties[bountyId].owner = msg.sender;
    self.bounties[bountyId].amount = amount;
  }

  /** @dev Adds submission for a given bounty.
  * @param self bounty storage.
  * @param bountyId id of bounty.
  * @param submissionId id of submission.
  */
  function addSubmission(BountyStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    self.bounties[bountyId].submissionIds.push(submissionId);
  }

  /** @dev Accepts submission for a given bounty.
  * @param self bounty storage.
  * @param bountyId id of bounty.
  */
  function acceptSubmission(BountyStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    self.bounties[bountyId].acceptedSubmissionId = submissionId;
  }

  /** @dev Rejects submission for a given bounty.
  * @param self bounty storage.
  * @param bountyId id of bounty.
  */
  function rejectSubmission(BountyStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    self.bounties[bountyId].rejectedSubmissionIds.push(submissionId);
  }

  /** @dev Get a bounty by id
  * @param self bounty storage.
  * @param bountyId id of bounty.
  * @return bounty
  */
  function get(BountyStorage storage self, bytes32 bountyId) internal view returns (Bounty) {
    return self.bounties[bountyId];
  }
}
