import * as d3 from "d3";

export default function repSearch() {
  let handleAddress = function() {};
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
    const form = d3.select(d3.event.target);
    messages = form.select('.representative-search-form__messages');
    handleAddress(form.select('.address-input').node().value, receiveResponse);
    d3.event.preventDefault();
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

      form.append('div')
          .attr('class', 'representative-search-form__messages');
    });
  }

  search.handleAddress = function(val) {
    if (!val) { return handleAddress; }

    handleAddress = val;
    return this;
  }

  return search;
}
