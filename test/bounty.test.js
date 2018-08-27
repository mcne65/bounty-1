const Bounty = artifacts.require('./Bounty.sol');
const EIP20 = artifacts.require('./EIP20.sol');

contract('Bounty', ([owner, alice, bob, charlie]) => {
  let bounty;
  let eip20;

  const bountyId ='0x0000000000000000000000000000000000000000000000000000000000000001';

  const bobSubmissionId = '0x0000000000000000000000000000000000000000000000000000000000000001';
  const charlieSubmissionId = '0x0000000000000000000000000000000000000000000000000000000000000002';

  const aliceBalance = 10;
  const bobBalance = 20;

  /* test set up
   - alice and bob buy tokens, add aprovals for bounty contract
  */
  beforeEach('setup contract for each test', async () => {
    bounty = await Bounty.new();
    await bounty.buyTokens({from: alice, value: aliceBalance});
    await bounty.buyTokens({from: bob, value: bobBalance});
    eip20 = EIP20.at(await bounty.getTokenContractAddress.call());
    await eip20.approve(bounty.address, aliceBalance, {from: alice});
    await eip20.approve(bounty.address, bobBalance, {from: bob});
  });

  /*
   - alice creates bounty
   - [assert] alice's token balance has decreased
   - bob and charlie create submissions
   - [assert] submissions are recorded
   - alice accepts bob's submission
   - [assert] bob's token balance has increased
  */
  it('happy case accepts submission', async () => {
    const bountyAmount = 3;

    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    assert.equal(aliceBalance - bountyAmount, (await eip20.balanceOf(alice)).toNumber());
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.createSubmission(bountyId, charlieSubmissionId, {from: charlie});

    const listResponse = await bounty.listBountySubmissions.call(bountyId, {from: alice});
    assert.equal(2, listResponse.length);
    assert.equal(bobSubmissionId, listResponse[0][0]);
    assert.equal(charlieSubmissionId, listResponse[0][1]);

    await bounty.acceptSubmission(bobSubmissionId, {from: alice});


    const bountyAcceptedSubmissionResponse = await bounty.getBountyAcceptedSubmission.call(bountyId, {from: alice});
    assert.equal(bobSubmissionId, bountyAcceptedSubmissionResponse);
    assert.equal(bobBalance + bountyAmount, (await eip20.balanceOf(bob)).toNumber());
  });


  /*
   - alice attempts to create bounty with 0 amount
   - [assert] an error is thrown
  */
  it('does not create bounty on zero amount', async () => {
    const bountyAmount = 0;

    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice attempts to create bounty with 0x0 id
   - [assert] an error is thrown
  */
  it('does not create bounty on default id', async () => {
    const bountyAmount = 1;

    let err;
    try {
      await bounty.createBounty('0x0', bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice attempts to create bounty with negative amount
   - [assert] an error is thrown
  */
  it('does not create bounty on negative amount', async () => {
    const bountyAmount = -1;

    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice attempts to create bounty while contract is stopped
   - [assert] an error is thrown
  */
  it('does not create bounty on emergency stop', async () => {
    const bountyAmount = 3;
    await bounty.stopContract({from: owner});
    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice attempts to create bounty with an id collision
   - [assert] an error is thrown
  */
  it('does not create bounty if same id exists', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice attempts to create bounty with amount > balance
   - [assert] an error is thrown
  */
  it('does not create bounty on insufficient balance', async () => {
    const bountyAmount = 200;

    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - bob attempts to createa submission for a nonexistent id
   - [assert] an error is thrown
  */
  it('does not create submission if bounty does not exist', async () => {
    let err;
    try {
      await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice creates bounty
   - bob creates submission
   - bob attemps to create submission again
   - [assert] an error is thrown
  */
  it('does not create submission if same id exists', async () => {
    const bountyAmount = 2;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    let err;
    try {
      await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - bob attemps to create submission with default bounty id
   - [assert] an error is thrown
  */
  it('does not create submission with default bounty id', async () => {
    let err;
    try {
      await bounty.createSubmission('0x0', bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice creates bounty
   - bob attemps to create submission with default id
   - [assert] an error is thrown
  */
  it('does not create submission with default submission id', async () => {
    const bountyAmount = 2;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    let err;
    try {
      await bounty.createSubmission(bountyId, '0x0', {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice creates bounty
   - charlie creates submission
   - alice accepts charlie's submission
   - bob attemps to create submission
   - [assert] an error is thrown
  */
  it('does not create submission if bounty has accepted submission', async () => {
    const bountyAmount = 2;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, charlieSubmissionId, {from: charlie});
    await bounty.acceptSubmission(charlieSubmissionId, {from: alice});
    let err;
    try {
      await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - contract owner stops contract
   - bob attemps to create submission
   - [assert] an error is thrown
  */
  it('does not create submission on emergency stop', async () => {
    const bountyAmount = 2;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.stopContract({from: owner});
    let err;
    try {
      await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - bob creates submission
   - bob attemps to accept submission
   - [assert] an error is thrown
  */
  it('does not accept submission when not bounty owner', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});

    let err;
    try {
      await bounty.acceptSubmission(bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice creates bounty
   - bob creates submission
   - alice accepts submission
   - alice attempts to accept submission again
   - [assert] an error is thrown
  */
  it('does not accept submission when already accepted', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.acceptSubmission(bobSubmissionId, {from: alice});

    let err;
    try {
      await bounty.acceptSubmission(bobSubmissionId, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - bob creates submission
   - alice rejects submission
   - alice attempts to accept submission
   - [assert] an error is thrown
  */
  it('does not accept submission when already rejected', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.rejectSubmission(bobSubmissionId, {from: alice});

    let err;
    try {
      await bounty.acceptSubmission(bobSubmissionId, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - bob creates submission
   - contract owner stops contract
   - alice attempts to accept submission
   - [assert] an error is thrown
  */
  it('does not accept submission on emergency stop', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.stopContract({from: owner});

    let err;
    try {
      await bounty.acceptSubmission(bobSubmissionId, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - bob creates submission
   - alice accepts submission
   - alice attempts to reject submission
   - [assert] an error is thrown
  */
  it('does not reject submission when already accepted', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.acceptSubmission(bobSubmissionId, {from: alice});

    let err;
    try {
      await bounty.rejectSubmission(bobSubmissionId, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - bob creates submission
   - alice attempts to reject submission
   - contract owner stops contract
   - [assert] an error is thrown
  */
  it('does not reject submission on emergency stop', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.stopContract({from: owner});

    let err;
    try {
      await bounty.rejectSubmission(bobSubmissionId, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice creates bounty
   - bob creates submission
   - alice rejects
   - alice attempts to reject submission
   - [assert] an error is thrown
  */
  it('does not reject submission when already rejected', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.rejectSubmission(bobSubmissionId, {from: alice});
    let err;
    try {
      await bounty.rejectSubmission(bobSubmissionId, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - alice creates bounty
   - bob creates submission
   - alice rejects submission
   - [assert] bob's submission is marked rejected
  */
  it('rejects submission when bounty owner', async () => {
    const bountyAmount = 3;

    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    assert.equal(aliceBalance - bountyAmount, (await eip20.balanceOf(alice)).toNumber());

    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.rejectSubmission(bobSubmissionId, {from: alice});
    assert.equal(bobSubmissionId, (await bounty.listBountySubmissions.call(bountyId))[1][0]);
  });

  /*
   - alice creates bounty
   - bob creates submission
   - alice rejects submission
   - [assert] bob's submission is marked rejected
  */
  it('does not reject submission when not bounty owner', async () => {
    const bountyAmount = 3;

    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    assert.equal(aliceBalance - bountyAmount, (await eip20.balanceOf(alice)).toNumber());

    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    let err;
    try {
      await bounty.rejectSubmission(bobSubmissionId, {from: charlie});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });


  /*
   - lists bounties
   - [assert] bounties length is 0
  */
  it('lists bounties when none', async () => {
    const response = await bounty.listBounties.call({from: alice});
    assert.equal(response.length, 0);
  });

  /*
   - lists submissions
   - [assert] submissions length is 0
  */
  it('lists submissions when none', async () => {
    const response = await bounty.listBounties.call({from: alice});
    assert.equal(response.length, 0);
  });


  /*
   - alice attempts to stop contract
   - [assert] an error is thrown
  */
  it('does not stop contract when not contract owner', async () => {
    let err;
    try {
      await bounty.stopContract({from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - alice attempts to resume contract
   - [assert] an error is thrown
  */
  it('does not resume contract when not contract owner', async () => {
    let err;
    try {
      await bounty.stopContract({from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - owner resumes contract
   - [implicit assert] no error
  */
  it('resumes contract when contract owner', async () => {
    const bountyAmount = 3;
    await bounty.stopContract({from: owner});
    await bounty.resumeContract({from: owner});
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
  });

  /*
   - alice attempts to kill contract
   - [assert] an error is thrown
  */
  it('does not self-descruct when not owner', async () => {
    let err;
    try {
      await bounty.kill({from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
  });

  /*
   - owner kills contract
   - [implicit assert] no error
  */
  it('self-descructs when owner', async () => {
    await bounty.kill({from: owner});
  });
});
