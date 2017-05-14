#!/usr/bin/env node

require('isomorphic-fetch');
var districtInAppalachia = require('appalachia').districtInAppalachia;
var argv = require('minimist')(process.argv.slice(2));

var membersUrl = 'https://api.propublica.org/congress/v1/115/house/members.json';

var votesUrl = function getVotesUrl(rollCallNumber) {
  // 256 for vote in May
  // 192 for vote in March
  return 'https://api.propublica.org/congress/v1/115/house/sessions/1/votes/' + rollCallNumber + '.json';
}

var membersLookupPromise = fetch(membersUrl, {
  method: 'GET',
  headers: {
    'X-API-Key': process.env.PROPUBLICA_API_KEY
  }
})
.then(function(res) {
  return res.json();
})
.then(function(data) {
  return data.results[0].members.filter(function(member) {
    return districtInAppalachia(member.state, member.district);
  }).map(function(member) {
    return {
      id: member.id,
      ocd_id: member.ocd_id
    };
  }).reduce(function(lookup, member) {
    lookup[member.id] = member;
    return lookup;
  }, {});
});

var rollCallNumber = argv._[0];

// Get votes
var votesPromise = fetch(votesUrl(rollCallNumber), {
  method: 'GET',
  headers: {
    'X-API-Key': process.env.PROPUBLICA_API_KEY
  }
})
.then(function(res) {
  return res.json();
})
.then(function(data) {
  return data.results.votes.vote.positions;
});

Promise.all([membersLookupPromise, votesPromise]).then(function(data) {
  var lookup = data[0];
  var votes = data[1];

  votes.forEach(function(vote) {
    if (lookup[vote.member_id]) {
      lookup[vote.member_id].vote_position = vote.vote_position;
    }
  });

  console.log(JSON.stringify({
    votes: Object.keys(lookup).map(function(k) { return lookup[k]; })
  }));
});
