 /* eslint no-var: 0 */
App = {
  web3Provider: null,
  contracts: {},
  bs58: require('bs58'),

  init: function() {
    App.ipfs = window.IpfsApi('localhost', '5001');
    App.web3Provider = web3.currentProvider || new Web3.providers.HttpProvider('http://localhost:8545');
    web3 = new Web3(App.web3Provider);
    App.initContract();
    App.bindEvents();
  },

  bytes32FromHash: function(hash) {
    return `0x${App.bs58.decode(hash).slice(2).toString('hex')}`;
  },

  hashFromBytes32: function(bytes32Hex) {
    // Add our default ipfs values for first 2 bytes:
    // function:0x12=sha2, size:0x20=256 bits
    // and cut off leading "0x"
    var hashHex = '1220' + bytes32Hex.slice(2);
    var hashBytes = window.IpfsApi().Buffer.from(hashHex, 'hex');
    var hashStr = App.bs58.encode(hashBytes);
    return hashStr;
  },

  bindEvents: function() {
    $('#addBountyForm').on('submit', App.handleAddBounty);
    $('#addSubmissionForm').on('submit', App.handleAddSubmission);
    $('#buyTokensForm').on('submit', App.handleBuyTokens);
    $(document).on('click', '.btn-bounty-details', App.handleGetBountyDetails);
    $(document).on('click', '.btn-add-submission', App.handleAddSubmissionClicked);
    $(document).on('click', '.btn-download-submission', App.handleGetSubmissionDowload);
    $(document).on('click', '.btn-accept-submission', App.handleAcceptSubmission);
    $(document).on('click', '.btn-reject-submission', App.handleRejectSubmission);
  },

  initContract: function() {
    $.getJSON('contracts/Bounty.json', function(BountyArtifact) {
      App.contracts.Bounty = TruffleContract(BountyArtifact);
      App.contracts.Bounty.setProvider(App.web3Provider);
      $.getJSON('contracts/EIP20.json', function(EIP20Artifact) {
        App.contracts.EIP20 = TruffleContract(EIP20Artifact);
        App.contracts.EIP20.setProvider(App.web3Provider);
        App.setCurrentAccount(web3.eth.accounts[0]);
        setInterval(function() {
          App.setCurrentAccount(web3.eth.accounts[0]);
        }, 1000);
        App.getBounties();
      });
    });
  },

  getBounties: function() {
    var bountyRow = $('#bountyRow');
    var bountyTemplate = $('#bountyTemplate');
    App.contracts.Bounty.deployed().then(function(instance) {
      bountyRow.html('');
      instance.listBounties.call().then(function(bounties) {
        for (i = 0; i < bounties.length; i ++) {
          bountyTemplate.find('.panel-title').text(bounties[i]);
          bountyTemplate.find('.btn').attr('data-id', bounties[i]);

          bountyRow.append(bountyTemplate.html());
        }
      });
    });
  },

  withEIP20: function(cb) {
    App.contracts.Bounty.deployed().then(function(instance) {
      instance.getTokenContractAddress.call().then(function(address) {
        App.contracts.EIP20.at(address).then(function(eip20) {
          cb(eip20);
        });
      });
    });
  },

  setCurrentAccount: function(account) {
    App.account = account;
    $('#currentAccountHolder').text(account);
    App.withEIP20(function(eip20) {
      return eip20.balanceOf.call(account).then(function(balance) {
        $('#balanceHolder').text(balance.toNumber());
      });
    });
  },

  handleAcceptSubmission: function(event) {
    event.preventDefault();
    var submissionId = $(event.target).attr('data-id');
    var bountyId = $(event.target).attr('data-bounty-id');

    App.contracts.Bounty.deployed().then(function(instance) {
      return instance.acceptSubmission(submissionId, {from: App.account}).then(function(result) {
        App.handleGetBountySubmissions(bountyId);
      }).catch(function(err) {
        alert(err.message);
      });
    });
  },

  handleBuyTokens: function(event) {
    event.preventDefault();
    var data = $(event.target).serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    App.contracts.Bounty.deployed().then(function(instance) {
      return instance.buyTokens({from: App.account, value: data.amount}).then(function(result) {
        $('#buyTokensModal').modal('hide');
      }).catch(function(err) {
        $('#alert').html(err.message).removeClass('hidden');
        $('#buyTokensModal').modal('hide');
      });
    });
  },

  handleRejectSubmission: function(event) {
    $('#alert').html('').addClass('hidden');
    event.preventDefault();
    var submissionId = $(event.target).attr('data-id');
    var bountyId = $(event.target).attr('data-bounty-id');

    App.contracts.Bounty.deployed().then(function(instance) {
        return instance.rejectSubmission(submissionId, {from: App.account}).then(function(result) {
          App.handleGetBountySubmissions(bountyId);
        }).catch(function(err) {
          alert(err.message);
        });
    });
  },

  handleAddBounty: function(event) {
    event.preventDefault();
    $('#alert').html('').addClass('hidden');
    var data = $(event.target).serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});

    App.ipfs.files.add(window.IpfsApi().Buffer.from(JSON.stringify(data)), function(err, res) {
      if (err) {
        console.log(err);
        return;
      }

      App.contracts.Bounty.deployed().then(function(instance) {
        var bountyId = App.bytes32FromHash(res[0].hash);
        return App.withEIP20(function(eip20) {
          eip20.approve(instance.address, parseInt(data.amount)).then(function(approvalResult) {
            return instance.createBounty(bountyId, parseInt(data.amount), {from: App.account}).then(function(result) {
              $('#addBountyModal').modal('hide');
              return App.getBounties();
            });
          });
        });
      }).catch(function(err) {
        $('#alert').html(err.message).removeClass('hidden');
        $('#addBountyModal').modal('hide');
      });
    });
  },

  handleResponse: function(res, cb) {
    var string = '';
    res.on('data', function(buff) {
      var part = buff.toString();
      string += part;
    });

    res.on('end', function() {
     cb(string);
    });
  },

  handleAddSubmissionClicked: function(e) {
    $('#addSubmissionModal').data('bounty-id', $(e.target).attr('data-id'));
    $('#addSubmissionModal').modal('show');
  },

  handleGetBountySubmissions: function(bountyId) {
    var submissionTemplate = $('#submissionRowTemplate');
    var submissionRow = $('#submissionTable');

    return App.contracts.Bounty.deployed().then(function(instance) {
      return instance.getBountyAcceptedSubmission.call(bountyId).then(function(acceptedSubmission) {
        return instance.listBountySubmissions.call(bountyId).then(function(submissions) {
          submissionRow.html('');
          for (i = 0; i < submissions.length; i ++) {
            submissionTemplate.find('.label-success').addClass('hidden');
            submissionTemplate.find('.label-danger').addClass('hidden');
            submissionTemplate.find('.btn-accept-submission').removeClass('hidden');
            submissionTemplate.find('.btn-reject-submission').removeClass('hidden');
            if (acceptedSubmission != '0x0000000000000000000000000000000000000000000000000000000000000000') {
              submissionTemplate.find('.btn-accept-submission').addClass('hidden');
              submissionTemplate.find('.btn-reject-submission').addClass('hidden');
            }
            if (acceptedSubmission == submissions[i]) {
              submissionTemplate.find('.label-success').removeClass('hidden');
            }

            submissionTemplate.find('.submission-id').html(submissions[i]);
            submissionTemplate.find('.btn').attr('data-bounty-id', bountyId);
            submissionTemplate.find('.btn').attr('data-id', submissions[i]);

            submissionRow.append(submissionTemplate.html());
          }
        });
      });
    });
  },

  handleGetBountyDetails: function(e) {
    var bountyId = $(e.target).attr('data-id');

    App.ipfs.files.cat(App.hashFromBytes32(bountyId), function(err, res) {
      if (err) {
        console.log(err);
        return;
      }

      App.handleResponse(res, function(data) {
        var jsonData = JSON.parse(data);
        $('#bountyName').html(jsonData.name);
        $('#bountyAmount').html(jsonData.amount);
        $('#bountyDescription').html(jsonData.description);
        $('#bountyDetailsModal').modal('show');

        App.handleGetBountySubmissions(bountyId);
      });
    });
  },


  handleGetSubmissionDowload: function(e) {
    e.preventDefault();
    var bountyId = $(e.target).data('id');

    App.ipfs.files.cat(App.hashFromBytes32(bountyId), function(err, res) {
      if (err) {
        console.log(err);
        return;
      }

      App.handleResponse(res, function(data) {
        $('#submissionDownloadLink').attr('href', data);
        $('#submissionDownloadModal').modal('show');
      });
    });
  },

  handleAddSubmission: function(e) {
    e.preventDefault();
    var files = $('#submissionFile')[0].files;
    var bountyId = $('#addSubmissionModal').data('bounty-id');
    if (files.length != 1) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      App.ipfs.files.add(window.IpfsApi().Buffer.from(e.target.result), function(err, res) {
        if (err) {
          console.log(err);
          return;
        }
        App.contracts.Bounty.deployed().then(function(instance) {
          var submissionId = App.bytes32FromHash(res[0].hash);
          return instance.createSubmission(bountyId, submissionId, {from: App.account}).then(function(result) {
            $('#addSubmissionModal').modal('hide');
          }).catch(function(err) {
            console.log(err);
          });
        });
      });
    };


    reader.readAsDataURL(files[0]);
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
