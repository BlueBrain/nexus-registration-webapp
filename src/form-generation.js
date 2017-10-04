'use strict';

const { getPath } = require('./lib');
const formSection = document.querySelector('section.form');
const config = require('../config');

/**
 * Get fieldset tag from NodeShape of Schema
 * @param {object} shape - NodeShape which is being proccessed
 * @param {object} jsonLD - Schema object
 * @param {string} parentNode - Name of parent Shape(if nested)
 * @return {HTMLElement} FIELDSET tag containg form elements
 */
function fieldsetFromShape(shape, jsonLD, parentNode) {
  let fieldset = document.createElement('FIELDSET');
  fieldset.classList.add('form-group');

  //need to mention URI for NodeShape into fieldset
  if (shape['@id']) {
    //future scope for searching elements
    fieldset.dataset.name = getPath(shape['@id'], jsonLD['@context'])['fullPath'];
  }

  if (shape.path) {
    const pathObj = getPath(shape['path'], jsonLD['@context']);
    fieldset.name = pathObj['shortPath']; //need to set name attr for useless form element for future context building
    fieldset.dataset.path = pathObj['fullPath']; //also need for context
  }

  //if we have particular type of our NodeShape
  if (shape.targetClass || shape.class) {
    let input = document.createElement('INPUT');
    input.type = 'hidden';
    if (parentNode) {
      input.name = parentNode + '["@type"]';
    }
    else {
      input.name = '@type';
    }
    //value will be picked from one of values because second one will be always undefined
    input.value = getPath(shape.class||shape.targetClass, jsonLD['@context'])['fullPath'];
    fieldset.appendChild(input);
  }

  //NodeShape can contain properties either be a wrapper for another NodeShape
  //here we check if it's a properties container
  if (shape.property) {
    shape.property.forEach(property => {
      fieldset.appendChild(formElementFromProperty(property, jsonLD, parentNode));
    });
  }

  //here we check if it's a wrapper
  if (shape.node) {
    fieldset.appendChild(fieldsetFromShape(shape.node, jsonLD, parentNode));
  }

  return fieldset;
}

function formElementFromProperty(property, jsonLD, parentNode) {
  let formElement;
  let datatype = property.datatype;
  //if we have property shape which is wrapper for NodeShape then it is fieldset
  if (property.node !== undefined) {
    //get future name attr for this property
    const propName = getPath(property.path, jsonLD['@context'])['shortPath'];
    //check if this property shape is already nested we need to build name attr for future form element
    const combinedParentPath = parentNode?`${parentNode}["${propName}"]`:propName;
    return fieldsetFromShape(property, jsonLD, combinedParentPath);
  }
  //if we have in property then it is a selectbox
  if (property['in'] !== undefined) {
    formElement = document.createElement('LABEL');
    formElement.innerHTML = retrieveNameAttr(property, jsonLD['@context']);
    if (property.description) {
      formElement.querySelector('p').textContent += '( '+property.description+ ' )';
    }
    let selectWrapper = document.createElement('P');
    let select = document.createElement('SELECT');
    let pathObj = getPath(property.path, jsonLD['@context']);
    if (parentNode) {
      select.name = parentNode + '["' + pathObj['shortPath'] + '"]';
    }
    else {
      select.name = pathObj['shortPath'];
    }
    select.dataset.path = pathObj['fullPath'];
    property['in'].forEach(listItem => {
      let option = document.createElement('OPTION');
      option.textContent = listItem;
      option.value = listItem;
      select.appendChild(option);
    });
    select.classList.add('form-control');
    selectWrapper.appendChild(select)
    formElement.appendChild(selectWrapper);
    countCheck(property, formElement);
    return formElement;
  }

  //if we have defined datatype that means we will render a simple input
  if (datatype !== undefined) {
    let type = datatype.replace('xsd:', '');
    formElement = document.createElement('LABEL');
    formElement.innerHTML = retrieveNameAttr(property, jsonLD['@context']);
    if (property.description) {
      formElement.querySelector('p').textContent += '( '+property.description+ ' )';
    }
    let input = document.createElement('INPUT');
    input.classList.add('form-control');
    switch (type) {
      case 'float':
        input.type = 'number';
        input.step = 'any';
        break;
      case 'double':
        input.type = 'number';
        input.step = 'any';
        break;
      case 'integer':
        input.type = 'number';
        input.step = 1;
        break;
      case 'string':
        input.type = 'text';
        if (property.pattern) {
          input.pattern = property.pattern;
        }
        if (property.maxlength) {
          input.maxlength = property.maxlength;
        }
        break;
      case 'decimal':
        input.type = 'number';
        input.step = 'any';
      case 'dateTime':
        input.type = 'datetime-local';
        input.step = '1';
    }
    if (input.type === 'number') {
      if (property.maxExclusive) {
        input.max = property.maxExclusive--;
      }
      if (property.maxInclusive) {
        input.max = property.minInclusive;
      }
      if (property.minExclusive) {
        input.min = property.minExclusive++;
      }
      if (property.minInclusive) {
        input.min = property.minInclusive;
      }
    }
    const pathObj = getPath(property.path, jsonLD['@context']);
    if (parentNode) {
      input.name = parentNode + '[' + pathObj['shortPath'] + ']';
    }
    else {
      input.name = pathObj['shortPath'];
    }
    if (pathObj['fullPath']) {
      input.dataset.path = pathObj['fullPath'];
    }
    formElement.appendChild(input);
    // countCheck(property, formElement);
    return formElement;
  }

  //if we have property with class property then we will ask scigraph
  if (property.class !== undefined) {
    formElement = document.createElement('LABEL');
    formElement.innerHTML = retrieveNameAttr(property, jsonLD['@context']);
    return fetchscigraph(formElement, property.class, property.path, jsonLD['@context'], parentNode);
  }
  formElement = document.createElement('LABEL');
  formElement.innerHTML = retrieveNameAttr(property, jsonLD['@context']);
  if (property.description) {
    formElement.querySelector('p').textContent += '( '+property.description+ ' )';
  }
  let input = document.createElement('INPUT');
  input.classList.add('form-control');
  let pathObj = getPath(property.path, jsonLD['@context']);

  if (parentNode) {
    input.name = parentNode + '[' + pathObj['shortPath'] + ']';
  }
  else {
    input.name = pathObj['shortPath'];
  }
  input.dataset.path = pathObj['fullPath'];
  input.type = 'text';
  formElement.appendChild(input);
  // countCheck(property, formElement);
  return formElement;
}
function fetchscigraph(formElement, propertyClass, properyPath, context, parentNode) {
  const request = new XMLHttpRequest();
  request.open('GET', `${config.endpoints.scigraphNeighbors}/${propertyClass}?depth=10&blankNodes=false&relationshipType=subClassOf`, false);  // `false` makes the request synchronous
  request.send(null);

  if (request.status === 200) {
    let nodes = JSON.parse(request.responseText)['nodes'];
    let select = document.createElement('SELECT');
    select.classList.add('form-control');
    select.setAttribute('required', 'required');
    let pathObj = getPath(properyPath, context);
    if (parentNode) {
      select.name = parentNode + '[' + pathObj['shortPath'] + ']';
    }
    else {
      select.name = pathObj['shortPath'];
    }
    select.dataset.path = pathObj['fullPath'];
    let option;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]['id'] === propertyClass) {
        continue;
      }
      else {
        option = document.createElement('OPTION');
        option.value = nodes[i]['id'];
        option.textContent = nodes[i]['lbl'];
        select.appendChild(option);
      }
    }
    formElement.appendChild(select);
  }
  return formElement;
}
function countCheck(property, formElement) {
  if ((!property.minCount) && (!property.maxCount)) {
    return;
  }
  let lines = formElement.children;
  let element = lines[lines.length-1].children[0];
  if (property.minCount) {
    element.setAttribute('required', 'required');
  }
  if (property.maxCount) {
    element.setAttribute('maxCount', property.maxCount);
  }
  if (parseInt(property.maxCount) - parseInt(property.minCount) > 0) {
    element.name += '[]';
    let button = document.createElement('BUTTON');
    button.textContent = 'Add';
    addClickHandler(button);
    lines[lines.length-1].appendChild(button);
  }
}
function addClickHandler(button) {
  button.onclick = function(e) {
    e.preventDefault();
    let formElement = this.previousSibling;
    let line = this.parentElement;
    let wrapper = line.parentElement;
    if (parseInt(formElement.getAttribute('maxCount')) === (wrapper.children.length -1)) {
      alert('You reached the maximum count of fields');
      return;
    }
    else {
      let newLine = line.cloneNode(true);
      wrapper.appendChild(newLine);
      this.remove();
      addClickHandler(newLine.querySelector('button'));
    }
  }
}
function retrieveNameAttr(property, context) {
  return property.name?'<p>'+property.name+'</p>':'<p>'+getPath(property.path, context)['shortPath']+'</p>';
}

function createForm(jsonLD) {
  const shapes = jsonLD.shapes;
  const form = document.createElement('FORM');
  const submit = document.createElement('INPUT');
  const base = document.createElement('INPUT');
  const vocab = document.createElement('INPUT');
  submit.classList.add('btn');
  submit.classList.add('btn-primary');
  submit.type = 'submit';
  submit.value = 'Send';
  form.method = 'POST';
  form.name = 'entity';
  form.action = jsonLD['@id'];

  shapes.forEach(shape => {
      form.appendChild(fieldsetFromShape(shape, jsonLD));
  });

  //vocab should be presented in each schema and instance
  if (jsonLD['@context']['@vocab'] !== undefined) {
    vocab.name = '@context["@vocab"]';
    vocab.type = 'hidden';
    vocab.value = jsonLD['@context']['@vocab'];
    form.appendChild(vocab);
  }

  //base should be presented in each schema and instance
  if (jsonLD['@context']['@base'] !== undefined) {
    base.name = '@context["@base"]';
    base.type = 'hidden';
    base.value = jsonLD['@context']['@base'];
    form.appendChild(base);
  }

  form.appendChild(submit);
  formSection.innerHTML = '';
  formSection.appendChild(form);
  return jsonLD;
}

module.exports = createForm;
