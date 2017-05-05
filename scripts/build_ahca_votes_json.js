#!/usr/bin/env node

var fetch = require('node-fetch');
var districtInAppalachia = require('appalachia').districtInAppalachia;

var membersUrl = 'https://api.propublica.org/congress/v1/115/house/members.json';
var votesUrl = 'https://api.propublica.org/congress/v1/115/house/sessions/1/votes/256.json';


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

// Get votes
var votesPromise = fetch(votesUrl, {
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
