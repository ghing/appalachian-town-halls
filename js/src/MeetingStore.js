class MeetingStore {
  constructor() {
    this._meetings = [];
    this._meetingsByDate = {};
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
      official.meetings.forEach(meeting => this.addMeeting(meeting));
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

    return this;
  }

  getMeetingsForDate(date) {
    return this._meetingsByDate[date];
  }

  getMeetings() {
    return this._meetings;
  }
}

export default MeetingStore;
