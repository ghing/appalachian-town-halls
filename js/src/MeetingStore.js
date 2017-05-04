function setDefault(o, prop, dflt) {
  if (!(prop in o)) {
    o[prop] = dflt;
  }

  return o[prop];
}

class MeetingStore {
  constructor() {
    this._meetings = [];
    this._phoneMeetings = [];
    this._meetingsByDate = {};
    this._meetingsByOfficial = {};
    this._meetingsByDivision = {};
    this._phoneMeetingsByDivision = {};
    this._officials = [];
    this._officialsByDivision = {};
    this._phoneOnlyByDivision = {};
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
    this._officialsByDivision = {};

    officials.forEach(official => {
      this._officialsByDivision[official.office.division.ocd_id] = official;

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

    if (meeting.meeting_type == 'telephone') {
      this._phoneMeetings.push(meeting);
    }

    setDefault(this._meetingsByDate, meeting.date, []).push(meeting);

    setDefault(this._meetingsByOfficial, meeting.official.id, [])
      .push(meeting);

    const ocdId = meeting.official.office.division.ocd_id;
    setDefault(this._meetingsByDivision, ocdId, []).push(meeting);

    setDefault(this._phoneMeetingsByDivision, ocdId, []).push(meeting);

    if (this._phoneMeetingsByDivision.length == this._meetingsByDivision.length) {
      this._phoneOnlyByDivision[ocdId] = true;
    }
    else {
      this._phoneOnlyByDivision[ocdId] = false;
    }

    return this;
  }

  getMeetings() {
    return this._meetings;
  }

  getPhoneMeetings() {
    return this._phoneMeetings;
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
    const meetings = this._meetingsByDivision[ocdId];
    if (!meetings) {
      return [];
    }

    return meetings;
  }

  getPhoneMeetingsForDivision(ocdId) {
    const meetings = this._phoneMeetingsByDivision[ocdId];
    if (!meetings) {
      return [];
    }

    return meetings;
  }

  getOfficialForDivision(ocdId) {
    return this._officialsByDivision[ocdId];
  }

  getAvgMeetings() {
    return Math.round(this._meetings.length / this._officials.length);
  }

  getPercentPhoneMeetings() {
    return this._phoneMeetings.length / this._meetings.length;
  }
}

export default MeetingStore;
