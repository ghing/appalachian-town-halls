import 'core-js/fn/object/assign';
import * as d3 from "d3";

import {apStyleNumber, pctFormat, pluralize} from './utils';

function officialLastName(official) {
  const nameParts = official.name.split(' ');
  return nameParts[nameParts.length - 1];
}

const DEFAULT_LABELS = {
  noDistrictFound: "Could not find a district matching this address",
  multipleDistrictsFound: "Found more than one districts matching this address",
  districtName: function(ctx) {
    return `This address is in ${ctx.districtName}.`;
  },
  officialName: function(ctx) {
    return `The representative for this district is ${ctx.official.name}.`;
  },
  avgMeetings: function(ctx) {
    return  `This representative has held ${apStyleNumber(ctx.numMeetings)} ${pluralize('meeting', ctx.numMeetings)}, the average for Appalachian representatives.`;
  },
  aboveAvgMeetings: function(ctx) {
    return  `This representative has held ${apStyleNumber(ctx.numMeetings)} ${pluralize('meeting', ctx.numMeetings)}, more than the average for Appalachian representatives.`;
  },
  belowAvgMeetings: function(ctx) {
    const numMeetingsWord = ctx.numMeetings == 0 ? 'no' : ctx.numMeetings;
    return  `This representative has held ${apStyleNumber(ctx.numMeetingsWord)} ${pluralize('meeting', ctx.numMeetings)}, below the average of ${apStyleNumber(ctx.avgMeetings)} for Appalachian representatives.`;
  },
  noPhoneMeetings: function(ctx) {
    return `This representative hasn't held any phone meetings. ${pctFormat(ctx.pctPhoneMeetings)} percent of all meetings were held over the phone.`;
  },
  phoneMeetings: function(ctx) {
    return `This representative held ${apStyleNumber(ctx.numPhoneMeetings)} ${pluralize('meeting', ctx.numPhoneMeetings)} over the phone.  ${pctFormat(ctx.pctPhoneMeetings)} percent of all meetings were held over the phone.`;
  },
  ahcaVote: function(ctx) {
    return `${officialLastName(ctx.official)} voted "${ctx.ahcaVote}" on the American Healthcare Act.`;
  } 
};

export default function repContext() {
  let labels = Object.assign({}, DEFAULT_LABELS);

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
          .text(labels.districtName(data));
      }

      if (data.official) {
        el.append('span')
          .text(labels.officialName(data));
      }

      if (data.numMeetings == data.avgMeetings) {
        el.append('span')
          .text(labels.avgMeetings(data));
      }
      else if (data.numMeetings > data.avgMeetings) {
        el.append('span')
          .text(labels.aboveAvgMeetings(data));
      }
      else {
        el.append('span')
          .text(labels.belowAvgMeetings(data));
      }

      if (data.numPhoneMeetings == 0) {
        el.append('span')
          .text(labels.noPhoneMeetings(data));
      }
      else {
        el.append('span')
          .text(labels.phoneMeetings(data));
      }

      el.append('span')
        .text(labels.ahcaVote(data));
    });
  };

  context.labels = function(val) {
    if (!val) { return labels; }

    labels = Object.assign(labels, val);
    return context;
  }

  return context;
}
