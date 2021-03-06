import "core-js/fn/object/assign";
import "es6-promise/auto";
import "isomorphic-fetch";
import * as d3 from "d3";
import districtInAppalachia from "appalachia/lib/cd/district-in-appalachia";

import annotations from "./annotations";
import MeetingStore from "./MeetingStore";
import VoteStore from "./VoteStore";
import meetingTimeline from "./timeline";
import repSearch from "./repsearch";
import repContext from "./repcontext";

// eslint-disable-next-line import/prefer-default-export
export class App {
  constructor(options) {
    this.timelineContainer = options.timelineContainer;
    this.repSearchContainer = options.repSearchContainer;
    this.repContextContainer = options.repContextContainer;
    this.googleApiKey = options.googleApiKey;
    this.labels = Object.assign({
      multipleDistrictsFound: "Found more than one districts matching this address.",
      noDistrictFound: "Could not find a district matching this address.",
      nonAppalachianRep: "This representative's district does not include one of the counties in Appalachia.  This app only provides information about representatives from Appalachia.",
    }, options.labels);
    this.meetingStore = new MeetingStore();
    this.voteStore = new VoteStore();
    this.startDate = options.startDate || new Date(2017, 0, 20);
    this.endDate = options.endDate || new Date();
    this.dayRange = d3.timeDay.range(this.startDate, this.endDate, 1);
    this.timeFormat = d3.timeFormat("%Y-%m-%d");
    this.annotations = options.annotations || annotations;
    // Explicitely bind this method to the instance so that we can access
    // `this` when the method is used as a callback
    this.handleAddress = this.handleAddress.bind(this);
    this.handleReset = this.handleReset.bind(this);

    // Construct some d3 components
    this.timeline = meetingTimeline();
    this.search = repSearch()
      .handleAddress(this.handleAddress)
      .handleReset(this.handleReset);
    this.context = repContext()
      .labels(this.labels);

    // These are the state variables
    this.allDays = [];
    this.searchAddress = null;

    const meetingsPromise = fetch(options.officialMeetingsJsonUrl).then(res => res.json())
      .then(data => data.objects);

    const votesPromise = fetch(options.ahcaVotesJsonUrl).then(res => res.json())
      .then(data => data.votes);

    Promise.all([meetingsPromise, votesPromise]).then((data) => {
      const meetings = data[0];
      const votes = data[1];

      this.meetingStore.setOfficials(meetings);
      this.voteStore.setVotes(votes);

      this.allDays = this.meetingStore.meetingsByDay(
        this.dayRange,
        this.annotations,
        this.timeFormat,
      );

      this.renderTimeline(this.allDays);

      d3.select(this.repSearchContainer)
        .call(this.search);
    });
  }

  handleReset() {
    if (this.searchAddress !== null) {
      this.renderTimeline(this.allDays);
      d3.select(this.repContextContainer)
        .datum(null)
        .call(this.context);
    }
  }

  /**
   * Returns state and district number from an OCD ID.
   */
  static parseOcdId(ocdId) {
    const bits = ocdId.split("/");
    const cdBits = bits[bits.length - 1].split(":");
    const stateBits = bits[bits.length - 2].split(":");

    return {
      state: stateBits[1].toUpperCase(),
      cd: cdBits[1],
    };
  }

  renderTimeline(days) {
    d3.select(this.timelineContainer)
      .datum(days)
      .call(this.timeline, this.ahcaVoteForDivision.bind(this));
  }

  clearContext() {
    d3.select(this.repContextContainer)
      .selectAll("*")
      .remove();
  }

  handleAddress(address, callback) {
    this.searchAddress = address;

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
    const url = `https://content.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&includeOffices=false&levels=country&roles=legislatorLowerBody&alt=json&key=${this.googleApiKey}`;

    fetch(url).then(res => res.json()).then((data) => {
      if (!data || data.error) {
        callback({
          msg: this.labels.noDistrictFound,
        }, null);
        this.clearContext();
        return;
      }

      // Divisions is an object keyed by OCD ID. We need a list of these IDs.
      const divisions = Object.keys(data.divisions);

      // There should be one and only one congressional district for an address
      if (divisions.length !== 1) {
        callback({
          msg: (
            divisions.length === 0 ?
            this.labels.noDistrictFound :
            this.labels.multipleDistrictsFound
          ),
        }, null);
        this.clearContext();
        return;
      }

      // Success

      // Check and make sure that the district is in Appalachia
      const ocdId = divisions[0];
      const stateDistrict = App.parseOcdId(ocdId);

      if (!districtInAppalachia(stateDistrict.state, stateDistrict.cd)) {
        callback({
          msg: this.labels.nonAppalachianRep,
        }, null);
        this.clearContext();
        return;
      }

      // Tell the form
      callback(null, {});

      const meetingsForDivision = this.meetingStore.getMeetingsForDivision(divisions[0]);
      const meetingIds = {};
      meetingsForDivision.forEach((meeting) => {
        meetingIds[meeting.id] = true;
      });

      d3.select(this.repContextContainer)
        .datum({
          official: this.meetingStore.getOfficialForDivision(ocdId),
          numMeetings: meetingsForDivision.length,
          avgMeetings: this.meetingStore.getAvgMeetings(),
          districtName: data.divisions[ocdId].name,
          numPhoneMeetings: this.meetingStore.getPhoneMeetingsForDivision(ocdId).length,
          pctPhoneMeetings: this.meetingStore.getPercentPhoneMeetings(),
          ahcaVote: this.ahcaVoteForDivision(ocdId),
        })
        .call(this.context);

      const days = this.meetingStore.meetingsByDay(
        this.dayRange,
        this.annotations,
        this.timeFormat,
        meeting => meetingIds[meeting.id],
      );
      this.renderTimeline(days);
    });
  }


  ahcaVoteForDivision(ocdId) {
    return this.voteStore.getVoteForDivision(ocdId).vote_position.toLowerCase();
  }
}
