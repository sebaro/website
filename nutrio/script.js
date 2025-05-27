/*
	@licstart  The following is the entire license notice for the
	JavaScript code in this page.

	Copyright (C) 2010 - 2025 Sebastian Luncan

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program. If not, see <http://www.gnu.org/licenses/>.

	Website: http://sebaro.pro
	Contact: http://sebaro.pro/contact

	@licend  The above is the entire license notice
	for the JavaScript code in this page.
*/


function dom(object, type, properties, parent, event, listener) {
  var method = 'modify';
  if (!object) {
    object = document.createElement(type);
    method = 'create';
  }
	for (var property in properties) {
		if (property == 'target') object.setAttribute('target', properties[property]);
		else object[property] = properties[property];
	}
	if (parent) {
		parent.appendChild(object);
	}
	if (event && listener) {
		object.addEventListener(event, listener, false);
	}
	if (method == 'create') {
    return object;
  }
}

function request(query, callback) {
  console.log(query);
  var url = 'https://sebaro-apps.vercel.app/api/nutricalc';
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          response = JSON.parse(xhr.responseText);
          if (response.errors) {
            error(response.errors, callback.name);
          }
          else {
            callback();
          }
        }
        catch(e) {
          error('Failed to get a response');
        }
      }
      else {
        error('Failed to get a response');
      }
    }
  };
  xhr.onerror = function(e) {
    error('Failed to get a response');
  };
  xhr.send(JSON.stringify(query));

}

function parse(id, json) {
  var lop;
  var ids = id.split(' ');
  if (id.indexOf('or') != -1) {
    lop = 'or';
    ids = id.split('or');
  }
  else if (id.indexOf('and') != -1) {
    lop = 'and';
    ids = id.split('and');
  }
  var val = 0;
  var name, unit, value;
  for (var i = 0; i < ids.length; i++) {
    for (var j = 0; j < json.length; j++) {
      if (ids[i] == json[j]['id']) {
        name = json[j]['name'];
        unit = json[j]['unit'].toLowerCase();
        value = json[j]['value'];
        if (unit == 'g') value = value * 1000000;
        if (unit == 'mg') value = value * 1000;
        if (unit == 'iu') value = value * 0.3;
        if (lop == 'or') {
          if (!val) {
            val = + value;
          }
          else {
            i = ids.length;
          }
        }
        else if (lop == 'and') {
          val += + value;
        }
        else {
          val = + value;
          i = ids.length;
        }
        break;
      }
    }
  }
  return val;
}

function search(keywords) {

  dom(button_search, null, {value: 'Searching', disabled: true});

  var type = 'nutrient';
  var nutrient;
  var keywordz = keywords.split(' ');
  if (keywords.toLowerCase().indexOf('proximate') != -1) {
    var nutrient = keywordz[1].charAt(0).toUpperCase() + keywordz[1].slice(1);
    if (nutrients['Proximates'][nutrient]) {
      keywords = nutrients['Proximates'][nutrient]['id'];
    }
  }
  else if (keywords.toLowerCase().indexOf('mineral') != -1) {
    var nutrient = keywordz[1].charAt(0).toUpperCase() + keywordz[1].slice(1);
    if (nutrients['Minerals'][nutrient]) {
      keywords = nutrients['Minerals'][nutrient]['id'];
    }
  }
  else if (keywords.toLowerCase().indexOf('vitamin') != -1) {
    var nutrient = keywordz[1].charAt(0).toUpperCase() + keywordz[1].slice(1);
    if (nutrients['Vitamins'][nutrient]) {
      keywords = nutrients['Vitamins'][nutrient]['id'];
    }
  }
  else {
    type = 'food';
  }

  request({'method':'search', 'type': type, 'string': keywords, 'results': 100}, list.bind(null, 'foo'));

}

function list() {

  dom(button_search, null, {value: 'Search', disabled: false});

  if (select_food && select_weight) {
    dom(select_food, null, {innerHTML: ''});
    dom(select_weight, null, {innerHTML: ''});
  }
  else {
    select_food = dom(null, 'select', {className: 'select_food'}, form);
    select_weight = dom(null, 'select', {className: 'select_weight'}, form);
    button_show = dom(null, 'input', {type: 'button', className: 'button', value: 'Show'}, form, 'click', function() {
      show(select_food.value);
    });
    button_add = dom(null, 'input', {type: 'button', className: 'button', value: 'Add'}, form, 'click', function() {
      add(select_food.value);
    });
  }

  var name, id, value, unit, option;
  for (var i = 0; i < response.length; i++) {
    name = response[i]['name'];
    value = response[i]['value'];
    if (value) {
      if (input_search_text.toLowerCase().indexOf('energy') != -1) {
        value = convert(value, 'kcal', 'pad');
      }
      else {
        value = convert(value, 'g', 'pad');
      }
      name = '[ ' + value + ' ]\xA0\xA0' + name;
    }
    id = response[i]['id'];
    option = dom(null, 'option', {textContent: name, value: id}, select_food);
  }
  for (var i = 1; i <= weights; i++) {
    option = dom(null, 'option', {textContent: i * weightp + 'g', value: i * weightp}, select_weight);
    if (option.value == 100) option.selected = 'selected';
  }

}

function process(view) {

  weight = parseInt(select_weight.value);

  if (!data['foods'][food]) data['foods'][food] = response;

  if (view == 'show' || view == 'add') {
    if (view == 'show') {
      data['show'] = {};
    }
    else {
      data['add']['foods'][food] = {};
      data['add']['foods'][food]['weight'] = weight;
    }
    var value;
    for (var ng in nutrients) {
      for (var n in nutrients[ng]) {
        value = parse(nutrients[ng][n]['id'], data['foods'][food]);
        if (!value) value = 0;
        value = value * weight / 100;
        if (view == 'show') {
          data['show'][nutrients[ng][n]['name']] = value;
        }
        else {
          data['add']['foods'][food][nutrients[ng][n]['name']] = value;
        }
      }
    }
  }

  if (view == 'add' || view == 'remove') {
    data['add']['total'] = {};
    data['add']['total']['weight'] = 0;
    var v;
    for (var e in data['add']['foods']) {
      for (var n in data['add']['foods'][e]) {
        v = data['add']['foods'][e][n];
        if (data['add']['total'][n]) {
          data['add']['total'][n] += + v;
        }
        else {
          data['add']['total'][n] = + v;
        }
      }
    }
    view = 'add';
  }
  //console.log(data);
  refresh(view);

}

function show(id) {

  dom(button_show, '', {value: 'Showing', disabled: true});

  food = select_food[select_food.selectedIndex].text.replace(/.*\]/, '').trim();

  if (data['foods'][food]) {
    process('show');
  }
  else {
    request({'method':'report', 'type': 'food', 'string': id, 'results': 100}, process.bind(null, 'show'));
  }

}

function add(id) {

  dom(button_add, '', {value: 'Adding', disabled: true});

  food = select_food[select_food.selectedIndex].text.replace(/.*\]/, '').trim();

  if (data['foods'][food]) {
    process('add');
  }
  else {
    request({'method':'report', 'type': 'food', 'string': id, 'results': 100}, process.bind(null, 'add'));
  }

}

function remove(food) {

  delete data['add']['foods'][food];

  process('remove');

}

function refresh(view) {

  var stage = select_stage.value;

  if (view == 'show') {
    if (button_show) {
      dom(button_show, '', {value: 'Show', disabled: false});
    }
    dom(table_show, '', {innerHTML: ''});
    for (var ng in nutrients) {
      dom(null, 'div', {textContent: ng, className: 'nutrient_group'}, table_show);
      for (var n in nutrients[ng]) {
        dom(null, 'div', {textContent: n, className: 'nutrient_' + ng.toLowerCase() + '_header', title: nutrients[ng][n]['name']}, table_show);
      }
      dom(null, 'br', null, table_show);
      // Current Values
      dom(null, 'div', {textContent: 'Values', className: 'nutrient_group_current'}, table_show);
      for (var n in nutrients[ng]) {
        //cvalue = '999.999mg';
        cvalue = (food) ? data['show'][nutrients[ng][n]['name']] : 0;
        dom(null, 'div', {textContent: convert(cvalue, n, 'strip'), className: 'nutrient_' + ng.toLowerCase()}, table_show);
      }
      dom(null, 'br', null, table_show);
    }
    dom(null, 'br', null, table_show);
    dom(null, 'br', null, table_show);
  }

  if (view == 'add') {
    if (button_add) {
      dom(button_add, '', {value: 'Add', disabled: false});
    }
    dom(table_add, '', {innerHTML: ''});
    // Foods
    dom(null, 'div', {textContent: 'Food', className: 'food_header'}, table_add);
    dom(null, 'div', {textContent: 'Weight', className: 'weight_header'}, table_add);
    dom(null, 'div', {className: 'food_remove_hidden'}, table_add);
    for (var e in data['add']['foods']) {
      dom(null, 'br', null, table_add);
      dom(null, 'div', {textContent: e, className: 'food'}, table_add);
      dom(null, 'div', {textContent: data['add']['foods'][e]['weight'] + 'g', className: 'weight'}, table_add);
      dom(null, 'div', {textContent: 'x', className: 'food_remove'}, table_add, 'click', remove.bind(null, e));
    }

    dom(null, 'br', null, table_add);

    // Total
    dom(null, 'div', {textContent: 'Total', className: 'total_header'}, table_add);
    dom(null, 'div', {textContent: data['add']['total']['weight'] + 'g', className: 'total_weight'}, table_add);
    dom(null, 'div', {className: 'food_remove_hidden'}, table_add);

    dom(null, 'br', null, table_add);

    // Nutrients Total
    var avalue = 0;
    var tvalue = 0;
    var cvalue = 0;
    var uvalue = 0;
    var ovalue = 0;
    var svalue;
    for (var ng in nutrients) {
      dom(null, 'br', null, table_add);
      dom(null, 'div', {textContent: ng, className: 'nutrient_group'}, table_add);
      for (var n in nutrients[ng]) {
        dom(null, 'div', {textContent: n, className: 'nutrient_' + ng.toLowerCase() + '_header', title: nutrients[ng][n]['name']}, table_add);
      }
      dom(null, 'br', null, table_add);
      // Adequate Values
      dom(null, 'div', {textContent: 'Adequate', className: 'nutrient_group_adequate'}, table_add);
      for (var n in nutrients[ng]) {
        avalue = intake[ng][n][stage]['adequate'];
        avalue = (avalue > 0) ? convert(avalue, n, 'strip') : 'ND';
        dom(null, 'div', {textContent: avalue, className: 'nutrient_' + ng.toLowerCase()}, table_add);
      }
      dom(null, 'br', null, table_add);
      // Tolerable Values
      dom(null, 'div', {textContent: 'Tolerable', className: 'nutrient_group_tolerable'}, table_add);
      for (var n in nutrients[ng]) {
        tvalue = intake[ng][n][stage]['tolerable'];
        tvalue = (tvalue > 0) ? convert(tvalue, n, 'strip') : 'ND';
        dom(null, 'div', {textContent: tvalue, className: 'nutrient_' + ng.toLowerCase()}, table_add);
      }
      dom(null, 'br', null, table_add);
      // Current Values
      dom(null, 'div', {textContent: 'Current', className: 'nutrient_group_current'}, table_add);
      for (var n in nutrients[ng]) {
        // uvalue = adequate - (adequate * 20/100)
        // ovalue = adequate + (tolerable - adequate) * 50/100
        // 0 < uvalue <= value <= ovalue < tolerable
        avalue = intake[ng][n][stage]['adequate'];
        if (!avalue || avalue < 0) avalue = 0;
        tvalue = intake[ng][n][stage]['tolerable'];
        if (!tvalue || tvalue < 0) {
          tvalue = (avalue > 0) ? avalue * 100 : 1000000000000;
        }
        uvalue = avalue - (avalue * 20 / 100);
        ovalue = avalue + ((tvalue - avalue) * 50 / 100);
        cvalue = data['add']['total'][nutrients[ng][n]['name']];
        if (!cvalue || cvalue < 0) cvalue = 0;
        if (cvalue < uvalue) {
          svalue = 'nutrient_' + ng.toLowerCase() + ' nutrient_warning';
        }
        else if (uvalue <= cvalue && cvalue <= ovalue) {
          svalue = 'nutrient_' + ng.toLowerCase() + ' nutrient_good';
        }
        else if (cvalue >= tvalue) {
          svalue = 'nutrient_' + ng.toLowerCase() + ' nutrient_alert';
        }
        else {
          svalue = 'nutrient_' + ng.toLowerCase() + ' nutrient_warning';
        }
        cvalue = (cvalue > 0) ? convert(cvalue, n, 'strip') : 0;
        dom(null, 'div', {textContent: cvalue, className: svalue}, table_add);
      }
      dom(null, 'br', null, table_add);
    }
  }

}

function convert(value, unit, format) {

  unit = (unit == 'Energy' || unit == 'kcal') ? 'kcal' : 'g';
  if (value) {
    if (unit == 'g') {
      if (value >= 1000000) {
        unit = 'g';
        value = value / 1000000;
      }
      else if (value >= 1000) {
        unit = 'mg';
        value = value / 1000;
      }
      else {
       unit = '\u00b5g';
      }
      if (format == 'strip') {
        if (value.toString().indexOf('.') != -1) {
          value = parseFloat(value).toFixed(3);
          value = value.toString().replace(/0+$/, '');
          value = value.toString().replace(/\.$/, '');
        }
      }
      else if (format == 'pad') {
        value = parseFloat(value).toFixed(3);
        pad = '\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0\xA0';
        if (unit.length == 1) {
          unit += '\xA0\xA0';
          pad += '\xA0\xA0';
        }
        value = (pad + value).slice(-pad.length);
      }
      value = value + unit;
    }
    else {
      value = value + 'kcal';
    }
  }
  else {
    value = 0;
  }

  return value;

}

function error(reason) {

  dom(button_search, null, {value: 'Search', disabled: false});
  dom(button_show, null, {value: 'Show', disabled: false});
  dom(button_add, null, {value: 'Add', disabled: false});

  if (!message) {
    message = dom(null, 'div', {className: 'error'}, null, 'click', function() {
      document.body.removeChild(this);
    });
  }
  if (!document.body.contains(message)) {
    dom(message, null, {textContent: reason}, document.body);
  }
  setTimeout(function() {
    if (document.body.contains(message)) {
      document.body.removeChild(message);
    }
  }, 5000);

}

function init() {

  select_stage = dom(null, 'select', {className: 'select_stage'}, header, 'change', function() {
    refresh('add');
  });
  for (var s in stages) {
    dom(null, 'option', {value: s, textContent: stages[s]}, select_stage);
  }

  input_search = dom(null, 'input', {type: 'search', value: input_search_text, className: 'input'}, form, 'focus', function() {
    if (this.value == input_search_text) {
      this.value = '';
      this.style.color = '#336699';
    }
  });
  dom(input_search, null, null, null, 'click', function() {
    if (this.value == input_search_text) {
      this.value = '';
      this.style.color = '#336699';
    }
  });
  dom(input_search, null, null, null, 'keyup', function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
      if (input_search.value != '' && input_search.value != input_search_text) {
        search(input_search.value);
        input_search_text = input_search.value;
      }
    }
  });

  button_search = dom(null, 'input', {type: 'submit', value: 'Search', className: 'button'}, form, 'click', function() {
    if (input_search.value != '' && input_search.value != input_search_text) {
      search(input_search.value);
      input_search_text = input_search.value;
    }
  });

  table_show = dom(null, 'div', null, table);
  table_add = dom(null, 'div', null, table);

  refresh('show');
  refresh('add');

}

var response;
var data = {};
data['foods'] = {};
data['show'] = {};
data['add'] = {};
data['add']['foods'] = {};
data['add']['total'] = {};
data['add']['total']['weight'] = 0;

var weights = 100;
var weightp = 5;

var header = document.getElementById('header');
var select_stage;

var form = document.getElementById('form');
var input_search, button_search;
var input_search_text = 'Search by food, eg: "raw broccoli" or by nutrient, eg: "proximate protein", "vitamin a", "mineral K"';
var select_food, food, select_weight, weight;
var button_show, button_add;

var table = document.getElementById('table');
var table_show, table_add;

var message;

init();
