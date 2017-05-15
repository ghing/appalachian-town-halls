function setDefault(o, prop, dflt) {
  if (!(prop in o)) {
    // eslint-disable-next-line no-param-reassign
    o[prop] = dflt;
  }

  return o[prop];
}

class MeetingStore {
  constructor() {
    this.meetings = [];
    this.phoneMeetings = [];
    this.meetingsByDate = {};
    this.meetingsByOfficial = {};
    this.meetingsByDivision = {};
    this.phoneMeetingsByDivision = {};
    this.officials = [];
    this.officialsByDivision = {};
    this.phoneOnlyByDivision = {};
  }

  setOfficials(officials) {
    this.officials = officials;
    this.setMeetingsFromOfficials(this.officials);
  }

  getOfficials() {
    return this.officials;
  }

  setMeetingsFromOfficials(officials, sort = true) {
    this.meetings = [];
    this.meetingsByDate = {};
    this.officialsByDivision = {};

    officials.forEach((official) => {
      this.officialsByDivision[official.office.division.ocd_id] = official;

      official.meetings.forEach((meeting) => {
        // eslint-disable-next-line no-param-reassign
        meeting.official = official;
        this.addMeeting(meeting);
      });
    });

    if (sort) {
      this.sortMeetingsByDate();
    }

    return this;
  }

  sortMeetingsByDate() {
    this.meetings.sort((a, b) => {
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
    this.meetings.push(meeting);

    if (meeting.meeting_type === "telephone") {
      this.phoneMeetings.push(meeting);
    }

    setDefault(this.meetingsByDate, meeting.date, []).push(meeting);

    setDefault(this.meetingsByOfficial, meeting.official.id, [])
      .push(meeting);

    const ocdId = meeting.official.office.division.ocd_id;
    setDefault(this.meetingsByDivision, ocdId, []).push(meeting);

    setDefault(this.phoneMeetingsByDivision, ocdId, []).push(meeting);

    if (this.phoneMeetingsByDivision.length === this.meetingsByDivision.length) {
      this.phoneOnlyByDivision[ocdId] = true;
    }
    else {
      this.phoneOnlyByDivision[ocdId] = false;
    }

    return this;
  }

  getMeetings() {
    return this.meetings;
  }

  getPhoneMeetings() {
    return this.phoneMeetings;
  }

  getMeetingsForDate(date, filter) {
    const meetings = this.meetingsByDate[date];
    if (!meetings) {
      return [];
    }

    if (filter) {
      return meetings.filter(filter);
    }

    return meetings;
  }

  getMeetingsForOfficial(officialId) {
    return this.meetingsByOfficial[officialId];
  }

  getMeetingsForDivision(ocdId) {
    const meetings = this.meetingsByDivision[ocdId];
    if (!meetings) {
      return [];
    }

    return meetings;
  }

  getPhoneMeetingsForDivision(ocdId) {
    const meetings = this.phoneMeetingsByDivision[ocdId];
    if (!meetings) {
      return [];
    }

    return meetings;
  }

  getOfficialForDivision(ocdId) {
    return this.officialsByDivision[ocdId];
  }

  getAvgMeetings() {
    return Math.round(this.meetings.length / this.officials.length);
  }

  getPercentPhoneMeetings() {
    return this.phoneMeetings.length / this.meetings.length;
  }
}

export default MeetingStore;
