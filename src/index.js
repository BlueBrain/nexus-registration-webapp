'use strict';

const { getResolvedSchema, printSchema, handleResponse } = require('@bbp/nexus-shacl-helpers');
const createForm = require('./form-generation');
const { sendForm } = require('./form-actions');
const config = require('../config');

const sourceSection = document.querySelector('section.source');
const organizationSelector = document.querySelector('select.organization');
if (organizationSelector) {
  organizationSelector.addEventListener('change', function() {
    fetch(`${this.value}/domains`)
    .then(handleResponse)
    .then(response => {
      let option;
      if (domainSelector) {
        domainSelector.remove();
        if (schemaSelector) {
          schemaSelector.remove();
        }
      }
      const domainSelector = document.createElement('SELECT');
      domainSelector.classList.add('domain', 'form-control');
      response.results.forEach(domainResult => {
        option = document.createElement('option');
        option.text = domainResult.resultId.split('/').pop();
        option.value = domainResult.resultId;
        domainSelector.add(option);
      });
      sourceSection.appendChild(domainSelector);
      domainSelector.addEventListener('change', function() {
        fetch(`${config.endpoints.schemasPrefix}/${organizationSelector.options[organizationSelector.selectedIndex].text}/${this.options[this.selectedIndex].text}`)
        .then(handleResponse)
        .then(response => {
          let option;
          const schemaSelector = document.createElement('SELECT');
          schemaSelector.classList.add('schema', 'form-control');
          response.results.forEach(schemaResult => {
            option = document.createElement('option');
            option.text = schemaResult.resultId;
            option.value = schemaResult.resultId;
            schemaSelector.add(option);
          });
          sourceSection.appendChild(schemaSelector);
          if (schemaSelector.options.length < 2) {
            schemaHandler.call(schemaSelector);
          }
          schemaSelector.addEventListener('change', schemaHandler, false);
        });
      }, false);
    });
  }, false);
}
document.addEventListener('DOMContentLoaded', event => {
  fetch(config.endpoints.organizations)
  .then(handleResponse)
  .then(response => {
    let option;
    response.results.forEach(orgResult => {
      option = document.createElement('option');
      option.text = orgResult.resultId.split('/').pop();
      option.value = orgResult.resultId;
      organizationSelector.add(option);
    });
  });
});

document.body.addEventListener('click', event => {
  if (event.target.type === 'submit') {
    event.preventDefault();
    sendForm();
  }
});
function schemaHandler() {
  fetch(this.value)
  .then(handleResponse)
  .then(getResolvedSchema)
  .then(schema => {
    return printSchema({content: schema, label: 'Schema details'});
  })
  .then(createForm)
  .catch(err => {
    console.log(err);
  })
}
