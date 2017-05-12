import 'core-js/fn/object/assign';
import 'es6-promise/auto';
import 'isomorphic-fetch';
import * as d3 from "d3";

import MeetingStore from './MeetingStore';
import VoteStore from './VoteStore';
import meetingTimeline from './timeline';
import repSearch from './repsearch';
import repContext from './repcontext';

export class App {
  constructor(options) {
    this._timelineContainer = options.timelineContainer;
    this._repSearchContainer = options.repSearchContainer;
    this._repContextContainer = options.repContextContainer;
    this._googleApiKey = options.googleApiKey;
    this._labels = Object.assign({}, options.labels);
    this._meetingStore = new MeetingStore();
    this._voteStore = new VoteStore();
    this._startDate = options.startDate || new Date(2017, 0, 20);
    this._endDate = options.endDate || new Date();
    this._annotations = options.annotations || {
      "2017-01-20": {
        label: "Inauguration day"
      },
      "2017-02-20": {
        label: "District work period begins"
      },
      "2017-02-24": {
        label: "District work period ends"
      },
      "2017-04-10": {
        label: "District work period begins"
      },
      "2017-04-21": {
        label: "District work period ends"
      }
    };

    // Explicitely bind this method to the instance so that we can access
    // `this` when the method is used as a callback
    this._handleAddress = this._handleAddress.bind(this);
    this._handleReset = this._handleReset.bind(this);

    // Construct some d3 components
    this._timeline = meetingTimeline();
    this._search = repSearch()
      .handleAddress(this._handleAddress)
      .handleReset(this._handleReset);
    this._context = repContext()
      .labels(this._labels);

    // These are the state variables
    this._allDays = [];
    this._searchAddress = null;

    const meetingsPromise = fetch(options.officialMeetingsJsonUrl).then(res => res.json())
      .then(data => {
        return data.objects;
      });

    const votesPromise = fetch(options.ahcaVotesJsonUrl).then(res => res.json())
    .then(data => {
      return data.votes;
    });

    Promise.all([meetingsPromise, votesPromise]).then(data => {
      const meetings = data[0];
      const votes = data[1];

      this._meetingStore.setOfficials(meetings);
      this._voteStore.setVotes(votes);

      this._allDays = this._meetingsByDay(
        this._meetingStore,
        this._startDate,
        this._endDate,
        this._annotations
      );

      this._renderTimeline(this._allDays);

      d3.select(this._repSearchContainer)
        .call(this._search);
    });
  }

  _handleReset() {
    if (this._searchAddress !== null) {
      this._renderTimeline(this._allDays);
      d3.select(this._repContextContainer)
        .datum(null)
        .call(this._context);
    }
  }

  _renderTimeline(days) {
    d3.select(this._timelineContainer)
      .datum(days)
      .call(this._timeline, this._ahcaVoteForDivision.bind(this));
  }

  _handleAddress(address, callback) {
    this._searchAddress = address;

    // Use the Google Civic Information API to lookup the U.S. Representative
    // for an address.
    //
    // See https://developers.google.com/civic-information/docs/v2/representatives/representativeInfoByAddress
    // for API docs.
    // A few quick notes:
    //
    // We just need to look up reps by their district, so we just need the
    // political division and not data about offices.  We exclude office data
    // by specifying `includeOffices=false`
    //
    // `levels=country` and `roles=legislatorLowerBody` specifies that we only
    // care about the house.
    const url = `https://content.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&includeOffices=false&levels=country&roles=legislatorLowerBody&alt=json&key=${this._googleApiKey}`;

    fetch(url).then(res => res.json()).then(data => {
      if (!data) {
        callback({
          msg: this._labels.noDistrictFound
        }, null);
        return;
      }
      // Divisions is an object keyed by OCD ID. We need a list of these IDs.
      const divisions = Object.keys(data.divisions);

      // There should be one and only one congressional district for an address
      if (divisions.length != 1) {
        callback({
          msg: division.length == 0 ? this._labels.noDistrictFound : this._labels.multipleDistrictsFound
        }, null);
      }

      // Success
      const ocdId = divisions[0];
      const districtName = data.divisions[ocdId].name;

      // Tell the form
      callback(null, {});

      const meetingsForDivision = this._meetingStore.getMeetingsForDivision(divisions[0]);
      const meetingIds = meetingsForDivision.reduce((lookup, meeting) => {
        lookup[meeting.id] = true;
        return lookup;
      }, {});

      d3.select(this._repContextContainer)
        .datum({
          official: this._meetingStore.getOfficialForDivision(ocdId),
          numMeetings: meetingsForDivision.length,
          avgMeetings: this._meetingStore.getAvgMeetings(),
          districtName: districtName,
          numPhoneMeetings: this._meetingStore.getPhoneMeetingsForDivision(ocdId).length,
          pctPhoneMeetings: this._meetingStore.getPercentPhoneMeetings(),
          ahcaVote: this._ahcaVoteForDivision(ocdId)
        })
        .call(this._context);

      const days = this._meetingsByDay(
        this._meetingStore,
        this._startDate,
        this._endDate,
        this._annotations,
        meeting => meetingIds[meeting.id]
      );
      this._renderTimeline(days);
    });
  }

  _meetingsByDay(meetingStore, startDate, endDate, annotations, filter) {
    const days = [];
    const format = d3.timeFormat("%Y-%m-%d");

    d3.timeDay.range(startDate, endDate, 1)
      .forEach((date, i) => {
        const dateStr = format(date);
        const meetings = meetingStore.getMeetingsForDate(dateStr, filter);

        if (meetings.length == 0 && !annotations[dateStr]) {
          return;
        }

        days.push({
          day: i+1,
          date: date,
          meetings: meetings,
          label: annotations[dateStr] ? annotations[dateStr].label : null
        });
      });

    return days.reverse();
  }

  _ahcaVoteForDivision(ocdId) {
    return this._voteStore.getVoteForDivision(ocdId).vote_position.toLowerCase();
  }
}
