import * as d3 from "d3";

export default function repContext() {
  let labels = {};

  let context = function(selection) {
    selection.each(function(data) {
      const sel = d3.select(this);

      sel.selectAll('*').remove();

      if (!data) {
        return;
      }

      const el = sel.append('div')
        .attr('class', 'representative-context');

      if (data.districtName) {
        el.append('span')
          .text(labels.districtName(data.districtName));
      }

      if (data.official) {
        el.append('span')
          .text(labels.officialName(data.official.name));
      }

      if (data.numMeetings == data.avgMeetings) {
        el.append('span')
          .text(labels.avgMeetings(data.numMeetings));
      }
      else if (data.numMeetings > data.avgMeetings) {
        el.append('span')
          .text(labels.aboveAvgMeetings(data.numMeetings, data.avgMeetings));
      }
      else {
        el.append('span')
          .text(labels.belowAvgMeetings(data.numMeetings, data.avgMeetings));
      }
    });
  };

  context.labels = function(val) {
    if (!val) { return labels; }

    labels = val;
    return this;
  }

  return context;
}
