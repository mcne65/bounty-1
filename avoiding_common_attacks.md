## Avoiding common attacks

### Logic bugs
* I have added extensive unig and integration tests to guard against bugs.
* I have followed coding standards and best practises
  * used design patterns as appropriate
  * extracted shared require() calls to modifiers
  * added emergency stop functionality
  * avoided complexity

### Reentrancy attacks
A possible attack vector for a reentrancy attack is the acceptSubmission(). function of the contract. User A may create a bounty for amount 10, then create a submission for this bounty, and use a reentrancy attack on acceptSubmission() to attempt to catch out 10 + 10 = 20 tokens. To prevent this kind of attack, the accepted submission id for a bounty is set before any value is transferred. Submissions can no longer be accepted for a bounty which already has an accepted submission.

### Integer arithmetic overflow / undeflow
Not applicable for the current contract. The contract uses a trusted EIP20 token implementation from the "tokens" package for transfer of value and balances.


### Poison data
All input is sanitised:
* ids are validated to have non-default value
* bounty amount is validated to be > 0


### tx.origin
The contract was specifically designed not to use tx.origin. Instead, it uses a combinaion of external and internal calls to EIP20 for token transfers.


### gas limits
The contract does not contain any loops.

### fallback function revert
A fallback function has been added which prevents certain types of attacks.
