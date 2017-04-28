var d3 = require('d3');

import MeetingStore from './MeetingStore';

export class App {
  constructor(options) {
    this._timelineContainer = options.timelineContainer;
    this._meetingStore = new MeetingStore();

    d3.json(options.officialMeetingsJsonUrl, data => {
      this._meetingStore.setOfficials(data.objects);

      console.log(this._meetingStore.getMeetings());
    });
  }
}
