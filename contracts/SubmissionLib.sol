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

  function newSubmission(SubmissionStorage storage self, bytes32 bountyId, bytes32 submissionId) internal {
    // submission should not exist
    require(self.submissions[submissionId].owner == 0x0);

    self.submissionIds.push(submissionId);
    self.submissions[submissionId].owner = msg.sender;
    self.submissions[submissionId].bountyId = bountyId;
  }

  function rejectSubmission(SubmissionStorage storage self, bytes32 submissionId) internal {
    self.submissions[submissionId].rejected = true;
  }

  function bountyId(SubmissionStorage storage self, bytes32 submissionId) internal view returns (bytes32) {
    return self.submissions[submissionId].bountyId;
  }

  function get(SubmissionStorage storage self, bytes32 submissionId) internal view returns (Submission) {
    return self.submissions[submissionId];
  }
}
