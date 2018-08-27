const Bounty = artifacts.require('./Bounty.sol');
const EIP20 = artifacts.require('./EIP20.sol');

contract('Bounty', ([owner, alice, bob, charlie]) => {
  let bounty;
  let eip20;

  const bountyId ='0x0000000000000000000000000000000000000000000000000000000000000001';
  const revertMessage = 'VM Exception while processing transaction: revert';

  const bobSubmissionId = '0x0000000000000000000000000000000000000000000000000000000000000001';
  const charlieSubmissionId = '0x0000000000000000000000000000000000000000000000000000000000000002';

  const aliceBalance = 10;
  const bobBalance = 20;

  beforeEach('setup contract for each test', async () => {
    bounty = await Bounty.new();
    await bounty.buyTokens({from: alice, value: aliceBalance});
    await bounty.buyTokens({from: bob, value: bobBalance});
    eip20 = EIP20.at(await bounty.getTokenContractAddress.call());
    await eip20.approve(bounty.address, aliceBalance, {from: alice});
    await eip20.approve(bounty.address, bobBalance, {from: bob});
  });

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

  it('does not create bounty on zero amount', async () => {
    const bountyAmount = 0;

    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('does not create bounty on default id', async () => {
    const bountyAmount = 1;

    let err;
    try {
      await bounty.createBounty('0x0', bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('does not create bounty on negative amount', async () => {
    const bountyAmount = -1;

    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

  it('does not create bounty on insufficient balance', async () => {
    const bountyAmount = 200;

    let err;
    try {
      await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('does not create submission if bounty does not exist', async () => {
    let err;
    try {
      await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

  it('does not create submission with default bounty id', async () => {
    let err;
    try {
      await bounty.createSubmission('0x0', bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

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
    assert.equal(err.message, revertMessage);
  });

  it('does not accept submission when not bounty owner', async () => {
    const bountyAmount = 3;
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});

    let err;
    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    try {
      await bounty.acceptSubmission(bobSubmissionId, {from: bob});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('rejects submission when bounty owner', async () => {
    const bountyAmount = 3;

    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
    assert.equal(aliceBalance - bountyAmount, (await eip20.balanceOf(alice)).toNumber());

    await bounty.createSubmission(bountyId, bobSubmissionId, {from: bob});
    await bounty.rejectSubmission(bobSubmissionId, {from: alice});
  });

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
    assert.equal(err.message, revertMessage);
  });

  it('lists bounties when none', async () => {
    const response = await bounty.listBounties.call({from: alice});
    assert.equal(response.length, 0);
  });

  it('lists submissions when none', async () => {
    const response = await bounty.listBounties.call({from: alice});
    assert.equal(response.length, 0);
  });

  it('does not stop contract when not contract owner', async () => {
    let err;
    try {
      await bounty.stopContract({from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('does not resume contract when not contract owner', async () => {
    let err;
    try {
      await bounty.stopContract({from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('resumes contract when contract owner', async () => {
    const bountyAmount = 3;
    await bounty.stopContract({from: owner});
    await bounty.resumeContract({from: owner});
    await bounty.createBounty(bountyId, bountyAmount, {from: alice});
  });

  it('does not self-descruct when not owner', async () => {
    let err;
    try {
      await bounty.kill({from: alice});
    } catch (error) {
      err = error;
    }

    assert.ok(err instanceof Error);
    assert.equal(err.message, revertMessage);
  });

  it('self-descructs when owner', async () => {
    await bounty.kill({from: owner});
  });
});
