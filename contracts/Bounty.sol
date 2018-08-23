pragma solidity ^0.4.23;

import "tokens/contracts/eip20/EIP20.sol";
import "./BountyLib.sol";
import "./SubmissionLib.sol";
import "./CircuitBreaker.sol";
import "./Mortal.sol";

/** @title Bounty contractr. */
contract Bounty is Mortal, CircuitBreaker, EIP20(1000000 * 10**uint(18), "Bounty Token", 18, "BTY")  {

  using BountyLib for BountyLib.BountyStorage;
  using SubmissionLib for SubmissionLib.SubmissionStorage;

  BountyLib.BountyStorage private bounties;
  SubmissionLib.SubmissionStorage private submissions;

  event CreateBounty(bytes32 bountyId, address owner, uint amount);
  event CreateSubmission(bytes32 submissionId, bytes32 bountyId, address owner);
  event AcceptSubmission(bytes32 submissionId);
  event RejectSubmission(bytes32 submissionId);


  modifier nonDefaultValue(bytes32 id) { require(id != 0x0); _;}
  modifier bountyOwner(bytes32 submissionId) { require(bounties.get(submissions.bountyId(submissionId)).owner == msg.sender); _;}
  modifier noAcceptedSubmission(bytes32 submissionId) { require(bounties.get(submissions.bountyId(submissionId)).acceptedSubmissionId == 0x0); _;}
  modifier nonRejectedSubmission(bytes32 submissionId) { require(submissions.get(submissionId).rejected == false); _;}

  /** @dev Creates a bounty and escrows bounty amount from contract.
  * @param bountyId bounty id.
  * @param amount bounty amount.
  */
  function createBounty(bytes32 bountyId, uint amount) external nonDefaultValue(bountyId) stoppedInEmergency {
    bounties.newBounty(bountyId, amount);
    transfer(this, amount);
    emit CreateBounty(bountyId, msg.sender, amount);
  }

  /** @dev Creates a submission for a bounty.
  * @param bountyId id of bounty.
  * @param submissionId id of submission.
  */
  function createSubmission(bytes32 bountyId, bytes32 submissionId)
    nonDefaultValue(bountyId)
    nonDefaultValue(submissionId)
    stoppedInEmergency external {

    // bounty should exist
    require(bounties.get(bountyId).owner != 0x0);

    // bounty should not have an accepted submission
    require(bounties.get(bountyId).acceptedSubmissionId == 0x0);

    submissions.newSubmission(bountyId, submissionId);
    bounties.addSubmission(bountyId, submissionId);
    emit CreateSubmission(submissionId, bountyId, msg.sender);
  }

  /** @dev Lists all bounties.
  * @return list of bounty ids.
  */
  function listBounties() external view returns (bytes32[]) {
    return bounties.bountyIds;
  }

  /** @dev Lists all submissions for a given bounty.
  * @return list of submission ids.
  */
  function listBountySubmissions(bytes32 bountyId) external view returns (bytes32[]) {
    return bounties.get(bountyId).submissionIds;
  }

  /** @dev Get accepted submission for a given bounty.
  * @param bountyId id of bounty.
  * @return submission id.
  */
  function getBountyAcceptedSubmission(bytes32 bountyId) external view returns (bytes32) {
    return bounties.get(bountyId).acceptedSubmissionId;
  }

  /** @dev Accepts a given submission, releasing the escrowed bounty amount to the bounty owner.
  * @param submissionId id of submission.
  */
  function acceptSubmission(bytes32 submissionId) external
    nonDefaultValue(submissionId)
    bountyOwner(submissionId)
    noAcceptedSubmission(submissionId)
    nonRejectedSubmission(submissionId)
    stoppedInEmergency {

    bounties.acceptSubmission(submissions.get(submissionId).bountyId, submissionId);
    this.transfer(submissions.get(submissionId).owner, bounties.get(submissions.bountyId(submissionId)).amount);
    emit AcceptSubmission(submissionId);
  }

  /** @dev Rejects a given submission.
  * @param submissionId id of submission.
  */
  function rejectSubmission(bytes32 submissionId) external
    nonDefaultValue(submissionId)
    bountyOwner(submissionId)
    noAcceptedSubmission(submissionId)
    nonRejectedSubmission(submissionId)
    stoppedInEmergency {

    submissions.rejectSubmission(submissionId);
    emit RejectSubmission(submissionId);
  }
}
