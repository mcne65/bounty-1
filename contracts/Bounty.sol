pragma solidity ^0.4.23;

import "tokens/contracts/eip20/EIP20.sol";
import "./CircuitBreaker.sol";
import "./Mortal.sol";

/** @title Bounty contractr. */
contract Bounty is Mortal, CircuitBreaker, EIP20(1000000 * 10**uint(18), "Bounty Token", 18, "BTY")  {

  struct Bounty {
    address owner;
    uint amount;
    bytes32[] submissionIds;
    bytes32 acceptedSubmissionId;
  }

  struct Submission {
    address owner;
    bytes32 bountyId;
    bool rejected;
  }

  bytes32[] public bountyIds;
  bytes32[] public submissionIds;

  mapping (bytes32 => Bounty) private bounties;
  mapping (bytes32 => Submission) private submissions;

  event CreateBounty(bytes32 bountyId, address owner, uint amount);
  event CreateSubmission(bytes32 submissionId, bytes32 bountyId, address owner);
  event AcceptSubmission(bytes32 submissionId);
  event RejectSubmission(bytes32 submissionId);

  modifier positive(uint amount) { require(amount > 0); _;}
  modifier nonDefaultValue(bytes32 id) { require(id != 0x0); _;}
  modifier bountyOwner(bytes32 _submissionId) { require(bounties[submissions[_submissionId].bountyId].owner == msg.sender); _;}
  modifier noAcceptedSubmission(bytes32 _submissionId) { require(bounties[submissions[_submissionId].bountyId].acceptedSubmissionId == 0x0); _;}
  modifier nonRejectedSubmission(bytes32 _submissionId) { require(submissions[_submissionId].rejected == false); _;}

  /** @dev Creates a bounty and escrows bounty amount from contract.
  * @param bountyId bounty id.
  * @param amount bounty amount.
  */
  function createBounty(bytes32 bountyId, uint amount) external nonDefaultValue(bountyId) positive(amount) stoppedInEmergency {
    // bounty should not exist
    require(bounties[bountyId].owner == 0x0);

    bountyIds.push(bountyId);
    bounties[bountyId].owner = msg.sender;
    bounties[bountyId].amount = amount;
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
    require(bounties[bountyId].owner != 0x0);

    require(bounties[bountyId].owner != 0x0);

    // submission should not exist
    require(submissions[submissionId].owner == 0x0);

    // bounty should not have an accepted submission
    require(bounties[bountyId].acceptedSubmissionId == 0x0);

    submissionIds.push(submissionId);
    submissions[submissionId].owner = msg.sender;
    submissions[submissionId].bountyId = bountyId;

    bounties[bountyId].submissionIds.push(submissionId);

    emit CreateSubmission(submissionId, bountyId, msg.sender);
  }

  /** @dev Lists all bounties.
  * @return list of bounty ids.
  */
  function listBounties() external view returns (bytes32[]) {
    return bountyIds;
  }

  /** @dev Lists all submissions for a given bounty.
  * @return list of submission ids.
  */
  function listBountySubmissions(bytes32 bountyId) external view returns (bytes32[]) {
    return bounties[bountyId].submissionIds;
  }

  /** @dev Get accepted submission for a given bounty.
  * @param bountyId id of bounty.
  * @return submission id.
  */
  function getBountyAcceptedSubmission(bytes32 bountyId) external view returns (bytes32) {
    return bounties[bountyId].acceptedSubmissionId;
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

    bounties[submissions[submissionId].bountyId].acceptedSubmissionId = submissionId;
    this.transfer(submissions[submissionId].owner, bounties[submissions[submissionId].bountyId].amount);
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

    submissions[submissionId].rejected = true;
    emit RejectSubmission(submissionId);
  }
}
