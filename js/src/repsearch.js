import * as d3 from "d3";

export default function repSearch() {
  let handleAddress = () => {};
  let handleReset = () => {};
  let messages = null;

  const receiveResponse = (err) => {
    if (err) {
      messages.text(err.msg);
      return;
    }

    messages.text("");
  };

  const handleSubmit = () => {
    d3.event.preventDefault();

    const form = d3.select(d3.event.target);
    const address = form.select(".representative-search-form__address-input").node().value;

    if (!address) {
      // Don't allow an empty address
      return false;
    }

    messages = form.select(".representative-search-form__messages");
    handleAddress(address, receiveResponse);

    return true;
  };

  const search = (selection) => {
    // eslint-disable-next-line func-names
    selection.each(function () {
      const sel = d3.select(this);

      sel.selectAll("*").remove();

      const form = sel.append("form")
          .attr("class", "representative-search-form")
          .on("submit", handleSubmit);

      form.append("input")
          .attr("type", "text")
          .attr("class", "representative-search-form__address-input")
          .attr("placeholder", "Enter your address");

      form.append("button")
          .attr("type", "submit")
          .text("Find your representative")
          .attr("class", "representative-search-form__btn representative-search-form__btn--submit");

      form.append("button")
          .attr("type", "reset")
          .text("Start over")
          .on("click", () => {
            messages.text("");
            messages.selectAll("*").remove();
            handleReset();
          })
          .attr("class", "representative-search-form__btn representative-search-form__btn--reset");

      form.append("div")
          .attr("class", "representative-search-form__messages");
    });
  };

  search.handleAddress = (val) => {
    if (!val) {
      return handleAddress;
    }

    handleAddress = val;
    return search;
  };

  search.handleReset = (val) => {
    if (!val) {
      return handleReset;
    }

    handleReset = val;
    return search;
  };

  return search;
}
