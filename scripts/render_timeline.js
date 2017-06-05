#!/usr/bin/env node

require("babel-register");

var JSDOM = require("jsdom").JSDOM;
var select = require("d3").select;
var timeDay = require("d3").timeDay;
var timeFormat = require("d3").timeFormat;

var annotations = require("../js/src/annotations").default;
var MeetingStore = require("../js/src/MeetingStore").default;
var VoteStore = require("../js/src/VoteStore").default;
var meetingTimeline = require("../js/src/timeline").default;

var meetings = require("../data/official_meetings.json").objects;
var votes = require("../data/ahca-votes-256.json").votes;

var main = function () {
  var startDate = new Date(2017, 0, 20);
  var endDate = new Date();
  var dayRange = timeDay.range(startDate, endDate, 1);
  var dayFormat = timeFormat("%Y-%m-%d");

  var timeline = meetingTimeline();
  var meetingStore = new MeetingStore();
  var voteStore = new VoteStore();

  meetingStore.setOfficials(meetings);
  voteStore.setVotes(votes);

  var days = meetingStore.meetingsByDay(
    dayRange,
    annotations,
    dayFormat
  );

  var dom = new JSDOM('<!DOCTYPE html><body><div id="townhall-timeline-container" class="timeline-container"></div></body>');
  var timelineContainer = dom.window.document.getElementById("townhall-timeline-container");

  select(timelineContainer)
    .datum(days)
    .call(timeline, function (ocdId) {
      return voteStore.getVoteForDivision(ocdId).vote_position.toLowerCase();
    });

  console.log(dom.serialize());
};

main();
