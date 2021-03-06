pragma solidity ^0.4.23;

import "tokens/contracts/eip20/EIP20.sol";
import "./BountyLib.sol";
import "./SubmissionLib.sol";
import "./CircuitBreaker.sol";
import "./Mortal.sol";

/** @title Bounty contractr. */
contract Bounty is Mortal, CircuitBreaker  {

  using BountyLib for BountyLib.BountyStorage;
  using SubmissionLib for SubmissionLib.SubmissionStorage;

  BountyLib.BountyStorage private bounties;
  SubmissionLib.SubmissionStorage private submissions;

  EIP20 private tokenContract = new EIP20(1000000 * 10**uint(18), "Bounty Token", 18, "BTY");

  event CreateBounty(bytes32 bountyId, address owner, uint amount);
  event CreateSubmission(bytes32 submissionId, bytes32 bountyId, address owner);
  event AcceptSubmission(bytes32 submissionId);
  event RejectSubmission(bytes32 submissionId);


  modifier nonDefaultValue(bytes32 id) { require(id != 0x0, "Non-default value for id required."); _;}
  modifier bountyOwner(bytes32 submissionId) {
    require(bounties.get(submissions.bountyId(submissionId)).owner == msg.sender,
      "This action can only be performed by the bounty owner.");
    _;}

  modifier noAcceptedSubmission(bytes32 bountyId) {
    require(bounties.get(bountyId).acceptedSubmissionId == 0x0,
      "This bounty is closed.");
    _;}

  modifier nonRejectedSubmission(bytes32 submissionId) {
    require(submissions.get(submissionId).rejected == false,
      "This submission is already rejected.");
    _;}

  modifier positive(uint amount) { require(amount > 0, "Bounty amount must be positive"); _;}

  /** @dev Buys tokens 1 BTY = 1 wei.
  */
  function buyTokens() external payable stoppedInEmergency {
    tokenContract.transfer(msg.sender, msg.value);
  }

  /** @dev Creates a bounty and escrows bounty amount from contract.
  * @param bountyId bounty id.
  * @param amount bounty amount.
  */
  function createBounty(bytes32 bountyId, uint amount) external positive(amount) nonDefaultValue(bountyId) stoppedInEmergency {
    tokenContract.transferFrom(msg.sender, this, amount);
    bounties.newBounty(bountyId, amount);
    emit CreateBounty(bountyId, msg.sender, amount);
  }

  /** @dev Creates a submission for a bounty.
  * @param bountyId id of bounty.
  * @param submissionId id of submission.
  */
  function createSubmission(bytes32 bountyId, bytes32 submissionId)
    nonDefaultValue(bountyId)
    nonDefaultValue(submissionId)
    noAcceptedSubmission(bountyId)
    stoppedInEmergency external {

    require(bounties.get(bountyId).owner != 0x0, "Bounty does not exist.");

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
  * @return (list of submission ids, list of rejected submission ids).
  */
  function listBountySubmissions(bytes32 bountyId) external view returns (bytes32[], bytes32[]) {
    return (bounties.get(bountyId).submissionIds, bounties.get(bountyId).rejectedSubmissionIds);
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
    bountyOwner(submissionId) // implicitly tests that bounty exists
    noAcceptedSubmission(submissions.bountyId(submissionId))
    nonRejectedSubmission(submissionId)
    stoppedInEmergency {

    bounties.acceptSubmission(submissions.get(submissionId).bountyId, submissionId);
    tokenContract.transfer(submissions.get(submissionId).owner, bounties.get(submissions.bountyId(submissionId)).amount);
    emit AcceptSubmission(submissionId);
  }

  /** @dev Rejects a given submission.
  * @param submissionId id of submission.
  */
  function rejectSubmission(bytes32 submissionId) external
    nonDefaultValue(submissionId)
    bountyOwner(submissionId) // implicitly tests that bounty exists
    noAcceptedSubmission(submissions.bountyId(submissionId))
    nonRejectedSubmission(submissionId)
    stoppedInEmergency {

    submissions.rejectSubmission(submissionId);
    bounties.rejectSubmission(submissions.bountyId(submissionId), submissionId);
    emit RejectSubmission(submissionId);
  }

  /** @dev Get address of token contract
  * @return address of contract token
  */
  function getTokenContractAddress() external returns (address) {
    return address(tokenContract);
  }

  /** @dev Reverts calls to nonexistent functions
  */
  function() public {
      revert("Fallback function called. Reverting.");
  }
}
