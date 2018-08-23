pragma solidity ^0.4.23;

import "./Owned.sol";

/** @title Circuit Breaker contractr. */
contract Mortal is Owned {

  /** @dev Kills contract and returns all funds to owner .*/
  function kill() public contractOwner {
    selfdestruct(owner);
  }
}
