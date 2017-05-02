import * as d3 from "d3";

import MeetingStore from './MeetingStore';
import meetingTimeline from './timeline';
import repSearch from './repsearch';
import repContext from './repcontext';

const DEFAULT_LABELS = {
  noDistrictFound: "Could not find a district matching this address",
  multipleDistrictsFound: "Found more than one districts matching this address",
  districtName: function(districtName) {
    return `This address is in ${districtName}.`;
  },
  officialName: function(officialName) {
    return `The representative for this district is ${officialName}.`;
  },
  avgMeetings: function(numMeetings) {
    const s = numMeetings == 1 ? '' : 's';
    return  `This representative has held ${numMeetings} meeting${s}, the average for Appalachian representatives.`;
  },
  aboveAvgMeetings: function(numMeetings, avgMeetings) {
    const s = numMeetings == 1 ? '' : 's';
    return  `This representative has held ${numMeetings} meeting${s}, more than the average for Appalachian representatives.`;
  },
  belowAvgMeetings: function(numMeetings, avgMeetings) {
    const s = numMeetings == 1 ? '' : 's';
    const numMeetingsWord = numMeetings == 0 ? 'no' : numMeetings;
    return  `This representative has held ${numMeetingsWord} meeting${s}, below the average of ${avgMeetings} for Appalachian representatives.`;
  }
};

export class App {
  constructor(options) {
    this._timelineContainer = options.timelineContainer;
    this._repSearchContainer = options.repSearchContainer;
    this._repContextContainer = options.repContextContainer;
    this._googleApiKey = options.googleApiKey;
    this._labels = options.labels || DEFAULT_LABELS;
    this._meetingStore = new MeetingStore();
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

    d3.json(options.officialMeetingsJsonUrl, data => {
      this._meetingStore.setOfficials(data.objects);
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
      .call(this._timeline);
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

    d3.json(url, data => {
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
          districtName: districtName
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
}
