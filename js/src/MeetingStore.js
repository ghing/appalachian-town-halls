class MeetingStore {
  constructor() {
    this._meetings = [];
    this._meetingsByDate = {};
    this._meetingsByOfficial = {};
    this._meetingsByDivision = {};
    this._officials = [];
  }

  setOfficials(officials) {
    this._officials = officials;
    this._setMeetingsFromOfficials(this._officials);
  }

  getOfficials() {
    return this._officials;
  }

  _setMeetingsFromOfficials(officials, sort = true) {
    this._meetings = [];
    this._meetingsByDate = {};

    officials.forEach(official => {
      official.meetings.forEach(meeting => {
        meeting.official = official;
        this.addMeeting(meeting);
      });
    });

    if (sort) {
      this._sortMeetingsByDate();
    }

    return this;
  }

  _sortMeetingsByDate() {
    this._meetings.sort((a, b) => {
      if (a.date > b.date) {
        return -1;
      }

      if (a.date < b.date) {
        return 1;
      }

      return 0;
    });
  }

  addMeeting(meeting) {
    this._meetings.push(meeting);

    if (!this._meetingsByDate[meeting.date]) {
      this._meetingsByDate[meeting.date] = [];
    }
    this._meetingsByDate[meeting.date].push(meeting);

    if (!this._meetingsByOfficial[meeting.official.id]) {
      this._meetingsByOfficial[meeting.official.id] = [];
    }
    this._meetingsByOfficial[meeting.official.id].push(meeting);

    const ocdId = meeting.official.office.division.ocd_id;
    if (!this._meetingsByDivision[ocdId]) {
      this._meetingsByDivision[ocdId] = [];
    }
    this._meetingsByDivision[ocdId].push(meeting);

    return this;
  }

  getMeetings() {
    return this._meetings;
  }

  getMeetingsForDate(date, filter) {
    const meetings = this._meetingsByDate[date];
    if (!meetings) {
      return [];
    }

    if (filter) {
      return meetings.filter(filter);
    }

    return meetings;
  }

  getMeetingsForOfficial(officialId) {
    return this._meetingsByOfficial[officialId];
  }

  getMeetingsForDivision(ocdId) {
    return this._meetingsByDivision[ocdId];
  }
}

export default MeetingStore;
