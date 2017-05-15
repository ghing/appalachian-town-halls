import * as d3 from "d3";

export function pluralize(s, n, plural) {
  if (n === 1) {
    return s;
  }

  if (plural) {
    return plural;
  }

  return `${s}s`;
}

export function pctFormat(val) {
  return d3.format(".0%")(val).replace("%", "");
}

export function apStyleNumber(num) {
  const lookup = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
  };

  if (num > 0 && num < 10) {
    return lookup[num];
  }

  return num;
}
