# Design Patterns Used

## Composition: EIP20 Token Standard
I am using an EIP20 token for value transfer between users. It is better to use a well-tested and widely adopted design instead of trying to reinvent the wheel.

## Emergency Stop
The emergency stop pattern is used to enable the contract owner stop any state changes in case a
vulnerability in the contract is discovered.

## Fail early and fail loud
I avoided the use of if/else conditions but rather validated input through require() calls. I then extracted require() calls into modifiers so they can be reused across functions. Some of these include:
* Create Bounty
  * bounty amount is > 0
  * no bounty exists for the given id
* Create Submission
  * a bounty with the bountyId exists
  * no submission exists for the given id
* Accept Submission
  * no accepted submission exists for bounty
  * submission not already rejected
* Reject Submission
  * no accepted submission exists for bounty
  * submission not already rejected

## Restricting Access
The contract restricts accepting/rejecting submissions to the bounty owner.


## Mortal
The contract implements the ability to self-descruct, removing itself from the blockchain and returning all of the funds to the contract owner.
