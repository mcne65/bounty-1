pragma solidity ^0.4.23;

library SubmissionLib {
  struct Submission {
    address owner;
    bytes32 bountyId;
    bool rejected;
  }

  struct SubmissionStorage {
    bytes32[] submissionIds;
    mapping (bytes32 => Submission) submissions;
  }

  /** @dev Creates a new submission.
  * @param self submission storage.
  * @param bountyId id of bounty.
  * @param submissionId id of submission.
  */
  function newSubmission(SubmissionStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    require(self.submissions[submissionId].owner == 0x0, "A submission with this id already exists.");
    require(self.submissionIds.length + 1 > self.submissionIds.length, "Unable to add submission - too many submissions.");

    self.submissionIds.push(submissionId);
    self.submissions[submissionId].owner = msg.sender;
    self.submissions[submissionId].bountyId = bountyId;
  }

  /** @dev Rejects submission.
  * @param self submission storage.
  * @param submissionId id of submission.
  */
  function rejectSubmission(SubmissionStorage storage self, bytes32 submissionId) internal {
    self.submissions[submissionId].rejected = true;
  }

  /** @dev Get the bounty id for a given submission
  * @param self submission storage.
  * @param submissionId id of submission.
  * @return bountyId id of bounty.
  */
  function bountyId(SubmissionStorage storage self, bytes32 submissionId) internal view returns (bytes32) {
    return self.submissions[submissionId].bountyId;
  }

  /** @dev Get a submission by id
  * @param self submission storage.
  * @param submissionId id of submission.
  * @return bounty
  */
  function get(SubmissionStorage storage self, bytes32 submissionId) internal view returns (Submission) {
    return self.submissions[submissionId];
  }
}
