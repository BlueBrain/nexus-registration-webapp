'use strict';
const { getResolvedSchema, getParentShapeInForm, getValue, printSchema, handleResponse } = require('@bbp/nexus-shacl-helpers');
const createForm = require('./form-generation');
const { fillForm, sendForm } = require('./form-actions');
const config = require('../config');

let rev;
const urlParts = location.pathname.split('/');
urlParts.splice(0, 3);
if (urlParts.length === 5) {
  const ID = urlParts[4];
  const ver = urlParts[3];
  const schema = urlParts[2];
  const domain = urlParts[1];
  const org = urlParts[0];
  const dataUrl = `${config.endpoints.dataPrefix }/${org}/${domain}/${schema}/${ver}/${ID}`;
  const schemaUrl = `${config.endpoints.schemasPrefix}/${org}/${domain}/${schema}/${ver}`;
  fetch(dataUrl)
  .then(handleResponse)
  .then(data => {
    rev = data.rev;
    fetch(schemaUrl)
    .then(handleResponse)
    .then(getResolvedSchema)
    .then(schema => {
      return printSchema({content: schema, label: 'Schema details'});
    })
    .then(createForm)
    .then(schema => {
      fillForm(schema, data);
      return data;
    })
    .then(data => {
      return printSchema({content: data, label: 'Instance details'});
    })
  })
  .catch(err => {
    alert('This Instance doesnt exist');
    console.log(err);
  })
}
else {
  alert('specify the ID');
}

document.body.addEventListener('click', function(event) {
  if (event.target.type === 'submit') {
    event.preventDefault();
    sendForm(ID, rev);
  }
}, false);
