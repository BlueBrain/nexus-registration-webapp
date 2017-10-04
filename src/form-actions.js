'use strict';

const { getParentShapeInForm, getValue } = require('./lib');

function fillForm(schema, data) {
  let parentShape;
  let inputs = document.querySelectorAll('input:not([type="submit"]):not([type="hidden"])');
  inputs.forEach(input => {
    parentShape = getParentShapeInForm(input);
    input.value = getValue(data, schema, input.dataset.path, parentShape);
  });
}

function sendForm(id, rev) {
  const form = document.forms.entity;
  // Call our function to get the form data.
  const data = formToJSON(form.elements);
  const contextElements = form.querySelectorAll('[name][data-path]');
  let ctxKey;
  for (let i = 0; i < contextElements.length; i++) {
    ctxKey = contextElements[i].name;
    //remove if we have multiple values
    ctxKey = ctxKey.replace('[]', '');
    let lastOpenScopeIndex = ctxKey.lastIndexOf('[');
    let lastCloseScopeIndex = ctxKey.lastIndexOf(']');
    if (lastOpenScopeIndex !== -1) {
      ctxKey = ctxKey.substring(lastOpenScopeIndex+1, lastCloseScopeIndex+1);
    }
    ctxKey = ctxKey.replace(/"/g, '');
    ctxKey = ctxKey.replace(']', '');
    if (data["@context"] === undefined) {
      data["@context"] = {};
    }
    if (data["@context"][`${ctxKey}`] === undefined) {
      data["@context"][`${ctxKey}`] = contextElements[i].dataset.path;
    }
  }
  const request = new XMLHttpRequest();
  if (id) {
    request.open('PUT', `/check/${id}/${rev}`);
  }
  else {
    request.open(form.method, form.action.replace('schemas','data'));
  }
  request.setRequestHeader('Content-Type','application/json');
  request.onreadystatechange = function() {//Call a function when the state changes.

    if(request.readyState == XMLHttpRequest.DONE && request.status >= 200 && request.status < 300) {
      const response = JSON.parse(request.responseText);
      const code = document.createElement('code');
      if (id) {
        code.textContent = `Instance with ID: ${response['@id']} was changed`;
      }
      else {
        code.textContent = `Instance with ID: ${response['@id']} was created`;
      }

      code.style.display = 'block';
      code.style.margin = '10px 0';
      document.forms.entity.appendChild(code);
      document.querySelector('input[type=submit]').classList.add('btn-success');
      setTimeout(() => {
        document.querySelector('input[type=submit]').classList.remove('btn-success');
        code.remove();
      }, 2000);
    }
  }
  request.send(JSON.stringify(data));
}

/**
 * Checks that an element has a non-empty `name` and `value` property.
 * @param  {Element} element  the element to check
 * @return {Bool}             true if the element is an input, false if not
 */
const isValidElement = element => {
  return element.name && element.value;
};

/**
 * Checks if an element’s value can be saved (e.g. not an unselected checkbox).
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the value should be added, false if not
 */
const isValidValue = element => {
  return (!['checkbox', 'radio'].includes(element.type) || element.checked);
};

/**
 * Checks if an input is a checkbox, because checkboxes allow multiple values.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a checkbox, false if not
 */
const isCheckbox = element => element.type === 'checkbox';

/**
 * Checks if an input is a `select` with the `multiple` attribute.
 * @param  {Element} element  the element to check
 * @return {Boolean}          true if the element is a multiselect, false if not
 */
const isMultiSelect = element => element.options && element.multiple;

/**
 * Retrieves the selected options from a multi-select as an array.
 * @param  {HTMLOptionsCollection} options  the options for the select
 * @return {Array}                          an array of selected option values
 */
const getSelectValues = options => [].reduce.call(options, (values, option) => {
  return option.selected ? values.concat(option.value) : values;
}, []);

/**
 * Retrieves input data from a form and returns it as a JSON object.
 * @param  {HTMLFormControlsCollection} elements  the form elements
 * @return {Object}                               form data as an object literal
 */
const formToJSON = elements => [].reduce.call(elements, (data, element) => {

  // Make sure the element has the required properties and should be added.
  if (isValidElement(element) && isValidValue(element)) {

    /*
     * Some fields allow for more than one value, so we need to check if this
     * is one of those fields and, if so, store the values as an array.
     */
    if (isCheckbox(element)) {
      data[element.name] = (data[element.name] || []).concat(element.value);
    } else if (isMultiSelect(element)) {
      data[element.name] = getSelectValues(element);
    } else {
      data[element.name] = element.value;
    }
  }

  return data;
}, {});

module.exports = { fillForm, sendForm };
