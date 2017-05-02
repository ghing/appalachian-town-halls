import * as d3 from "d3";

function ocdIdToDistrict(ocdId) {
  const bits = ocdId.split(':');
  const state = bits[bits.length - 2].slice(0, 2).toUpperCase();
  const district = bits[bits.length - 1];
  return state + "-" + district;
}

function officialDistrict(official) {
  return ocdIdToDistrict(official.office.division.ocd_id);
}

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

function getPartyLabel(party) {
  if (party == "Republican") {
    return "R";
  }
  else if (party == "Democratic") {
    return "D";
  }
}

function renderOfficial(sel) {
  sel.each(function(d) {
    const el = d3.select(this);

    const partyLabel = getPartyLabel(d.official.party);
    let officialClass = "timeline__meeting__official";
    if (partyLabel) {
      officialClass += " timeline__meeting__official--" + partyLabel.toLowerCase();
    }

    el.append('span')
        .attr('class', officialClass)
        .text(d.official.name);

    if (partyLabel) {
      el.append('span')
          .attr('class', 'timeline__meeting__party timeline__meeting__party--' + partyLabel.toLowerCase())
          .text(" (" + partyLabel + ")");
    }

    el.append('span')
        .attr('class', 'timeline__meeting__district')
        .text(" (" + officialDistrict(d.official) + ")");

    if (d.meetings.length == 1) {
      if (d.meetings[0].meeting_type == "telephone") {
        el.append('span')
            .attr('class', 'timeline__meeting__type timeline__meeting__type--telephone')
            .text(" \u260E");
      }
      else if (d.meetings[0].meeting_type == "facebook") {
        el.append('span')
            .attr('class', 'timeline__meeting__type timeline__meeting__type--facebook')
            .text(" f");
      }
      else if (d.meetings[0].meeting_type == "radio") {
        el.append('span')
            .attr('class', 'timeline__meeting__type timeline__meeting__type--radio')
            .text(" \u1F4FB");
      }
    }

    if (d.meetings.length > 1) {
      el.append('span')
          .attr('class', 'timeline__meeting__count')
          .text(" x" + d.meetings.length);
    }
  });
}

function renderDay(sel, dateFormat) {
  sel.append('h2')
    .attr('class', 'timeline__day__number')
    .text(d => d.day);

  sel.append('div')
    .attr('class', 'timeline__day__date')
    .text(d => dateFormat(d.date));

  sel.append('div')
    .attr('class', 'timeline__day__label')
    .text(d => d.label);

  sel.selectAll('.timeline__meeting')
    .data(d => meetingsByOfficial(d.meetings))
    .enter().append('div')
      .attr('class', 'timeline__meeting')
      .call(renderOfficial);
}

export default function meetingTimeline() {
  let dateFormat = d3.timeFormat("%B %d, %Y");

  function timeline(selection) {
    selection.each(function(days) {
      const container = d3.select(this);
      container.selectAll('*').remove();

      const timeline = container.append('div')
          .attr('class', 'timeline');

      timeline.selectAll('.timeline__day')
        .data(days)
        .enter().append('div')
          .attr('class', 'timeline__day')
          .call(renderDay, dateFormat);
    });
  }

  return timeline;
}
