pragma solidity ^0.4.23;

/** @title Owned contract. */
contract Owned {
  address public owner = msg.sender;

  modifier contractOwner { require(owner == msg.sender); _;}
}
