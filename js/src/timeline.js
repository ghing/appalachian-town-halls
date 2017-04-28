import * as d3 from "d3";

function meetingsByOfficial(meetings) {
  const byOfficial = meetings.reduce((lookup, meeting) => {
    if (!lookup[meeting.official.id]) {
      lookup[meeting.official.id] = {
        official: meeting.official,
        meetings: []
      };
    }
    lookup[meeting.official.id].meetings.push(meeting);
    return lookup;
  }, {});

  return d3.values(byOfficial);
}

function renderMeeting(sel) {
  sel.text(d => {
    let label = d.official.name;

    if (d.meetings.length > 1) {
      label += " x" + d.meetings.length;
    }

    return label;
  });
}

function renderDay(sel, dateFormat) {
  sel.append('span')
    .text(d => d.day);

  sel.append('span')
    .text(d => dateFormat(d.date));

  sel.selectAll('.timeline__meeting')
    .data(d => meetingsByOfficial(d.meetings))
    .enter().append('div')
      .call(renderMeeting);
}

export default function meetingTimeline() {
  let dateFormat = d3.timeFormat("%B %d, %Y");

  function timeline(selection) {
    selection.each(function(days) {
      const container = d3.select(this);

      container.selectAll('*').remove();

      container.selectAll('.timeline__day')
        .data(days)
        .enter().append('div')
          .attr('class', 'timeline__day')
          .call(renderDay, dateFormat);
    });
  }

  return timeline;
}
