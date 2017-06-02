import * as d3 from "d3";

function ocdIdToDistrict(ocdId) {
  const bits = ocdId.split(":");
  const state = bits[bits.length - 2].slice(0, 2).toUpperCase();
  const district = bits[bits.length - 1];
  return `${state}-${district}`;
}

function officialDistrict(official) {
  return ocdIdToDistrict(official.office.division.ocd_id);
}

function meetingsByOfficial(meetings) {
  const byOfficial = {};
  meetings.forEach((meeting) => {
    if (!byOfficial[meeting.official.id]) {
      byOfficial[meeting.official.id] = {
        official: meeting.official,
        meetings: [],
      };
    }
    byOfficial[meeting.official.id].meetings.push(meeting);
  });

  return d3.values(byOfficial);
}

function getPartyLabel(party) {
  const partyToLabel = {
    Republican: "R",
    Democratic: "D",
  };

  return partyToLabel[party];
}

function renderOfficial(sel, getAhcaVote) {
  // eslint-disable-next-line func-names
  sel.each(function (d) {
    const el = d3.select(this);

    const partyLabel = getPartyLabel(d.official.party);
    let officialClass = "timeline__meeting__official";
    if (partyLabel) {
      officialClass += ` timeline__meeting__official--${partyLabel.toLowerCase()}`;
    }

    el.append("span")
        .attr("class", officialClass)
        .text(d.official.name);

    if (partyLabel) {
      el.append("span")
          .attr("class", `timeline__meeting__party timeline__meeting__party--${partyLabel.toLowerCase()}`)
          .text(` (${partyLabel})`);
    }

    el.append("span")
        .attr("class", "timeline__meeting__district")
        .text(` (${officialDistrict(d.official)})`);

    if (d.meetings.length === 1) {
      if (d.meetings[0].meeting_type === "telephone") {
        el.append("span")
            .attr("title", "Telephone meeting")
            .attr("class", "timeline__meeting__type timeline__meeting__type--telephone")
            .text(" \u260E");
      }
      else if (d.meetings[0].meeting_type === "facebook") {
        el.append("span")
            .attr("class", "timeline__meeting__type timeline__meeting__type--facebook")
            .attr("title", "Facebook meeting")
            .text(" f");
      }
      else if (d.meetings[0].meeting_type === "radio") {
        el.append("span")
            .attr("class", "timeline__meeting__type timeline__meeting__type--radio")
            .attr("title", "Radio meeting")
            .text(" 📻");
      }
    }

    const ahcaVote = getAhcaVote(d.official.office.division.ocd_id);
    el.append("span")
        .attr("class", `ahca-vote--${ahcaVote}`)
        .attr("title", `Voted ${ahcaVote} on the AHCA`)
        .text(() => {
          if (ahcaVote === "yes") {
            return " \u2714";
          }

          return " \u274c";
        });

    if (d.meetings.length > 1) {
      el.append("span")
          .attr("class", "timeline__meeting__count")
          .text(` x${d.meetings.length}`);
    }
  });
}

function renderDay(sel, dateFormat, getAhcaVote) {
  sel.append("h2")
    .attr("class", "timeline__day__number")
    .text(d => d.day);

  sel.append("div")
    .attr("class", "timeline__day__date")
    .text(d => dateFormat(d.date));

  sel.append("div")
    .attr("class", "timeline__day__label")
    .text(d => d.label);

  sel.selectAll(".timeline__meeting")
    .data(d => meetingsByOfficial(d.meetings))
    .enter().append("div")
      .attr("class", "timeline__meeting")
      .call(renderOfficial, getAhcaVote);
}

export default function meetingTimeline() {
  const dateFormat = d3.timeFormat("%B %d, %Y");

  function timeline(selection, getAhcaVote) {
    // eslint-disable-next-line func-names
    selection.each(function (days) {
      const container = d3.select(this);
      container.selectAll("*").remove();
      container.text("");

      const timelineContainer = container.append("div")
          .attr("class", "timeline");

      timelineContainer.selectAll(".timeline__day")
        .data(days)
        .enter().append("div")
          .attr("class", "timeline__day")
          .call(renderDay, dateFormat, getAhcaVote);

      // Add a label that says "Day" before the first number.
      // I know right? All this code, just for that.
      timelineContainer.selectAll(".timeline__day__number")
        // eslint-disable-next-line func-names
        .each(function (d, i) {
          if (i !== 0) {
            return;
          }

          const dayNumber = d3.select(this);
          const text = dayNumber.text();

          dayNumber.text("");

          dayNumber.append("span")
              .attr("class", "timeline__day__day-label")
              .text("Day ");

          dayNumber.append("span")
              .text(text);
        });
    });
  }

  return timeline;
}
