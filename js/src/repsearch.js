import * as d3 from "d3";

export default function repSearch() {
  let handleAddress = function() {};
  let handleReset = function() {};
  let messages = null;

  let receiveResponse = function(err, data) {
    if (err) {
      messages.text(err.msg);
      return;
    }

    const message = `This address is in ${data.name}`;
    messages.text(message);
  };

  let handleSubmit = function() {
    d3.event.preventDefault();

    const form = d3.select(d3.event.target);
    const address = form.select('.address-input').node().value;

    if (!address) {
      // Don't allow an empty address
      return false;
    }

    messages = form.select('.representative-search-form__messages');
    handleAddress(address, receiveResponse);
  };

  const search = function(selection) {
    selection.each(function() {
      const sel = d3.select(this);

      sel.selectAll('*').remove();

      const form = sel.append('form')
          .attr('class', 'representative-search-form')
          .on('submit', handleSubmit);

      form.append('input')
          .attr('type', 'text')
          .attr('class', 'address-input')
          .attr('placeholder', "Enter your address");

      form.append('button')
          .attr('type', 'submit')
          .text("Find your representative");

      form.append('button')
          .attr('type', 'reset')
          .text("Start over")
          .on('click', () => {
            messages.text("");
            messages.selectAll('*').remove();
            handleReset();
          });

      form.append('div')
          .attr('class', 'representative-search-form__messages');
    });
  }

  search.handleAddress = function(val) {
    if (!val) { return handleAddress; }

    handleAddress = val;
    return this;
  }

  search.handleReset = function(val) {
    if (!val) { return handleReset; }

    handleReset = val;
    return this;
  }

  return search;
}
