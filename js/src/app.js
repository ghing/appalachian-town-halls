import * as d3 from "d3";

import MeetingStore from './MeetingStore';
import meetingTimeline from './timeline';

export class App {
  constructor(options) {
    this._timelineContainer = options.timelineContainer;
    this._meetingStore = new MeetingStore();
    this._startDate = options.startDate || new Date(2017, 0, 20);
    this._endDate = options.endDate || new Date();
    this._annotations = options.annotations || {
      "2017-01-20": {
        label: "Inauguration day"
      }
    };

    d3.json(options.officialMeetingsJsonUrl, data => {
      this._meetingStore.setOfficials(data.objects);
      const days = this._meetingsByDay(
        this._meetingStore,
        this._startDate,
        this._endDate,
        this._annotations
      );

      const timeline = meetingTimeline();
      d3.select(this._timelineContainer)
        .datum(days)
        .call(timeline);
    });
  }

  _meetingsByDay(meetingStore, startDate, endDate, annotations) {
    const days = [];
    const format = d3.timeFormat("%Y-%m-%d");

    d3.timeDay.range(startDate, endDate, 1)
      .forEach((date, i) => {
        const dateStr = format(date);
        const meetings = meetingStore.getMeetingsForDate(dateStr);

        if (!meetings && !annotations[dateStr]) {
          return;
        }

        days.push({
          day: i+1,
          date: date,
          meetings: meetings || [],
          label: annotations[dateStr] ? annotations[dateStr].label : null
        });
      });

    return days.reverse();
  }
}
