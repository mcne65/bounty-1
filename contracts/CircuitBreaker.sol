pragma solidity ^0.4.23;

import "./Owned.sol";

/** @title Circuit Breaker contractr. */
contract CircuitBreaker is Owned {
  bool isStopped = false;

  modifier stoppedInEmergency { require(!isStopped); _; }

  /** @dev Stops contract from executing.*/
  function stopContract() public contractOwner {
    isStopped = true;
  }
  /** @dev Resumes contract.*/
  function resumeContract() public contractOwner {
    isStopped = false;
  }
}
