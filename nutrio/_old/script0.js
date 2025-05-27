/*
	@licstart  The following is the entire license notice for the
	JavaScript code in this page.

	Copyright (C) 2010 - 2020 Sebastian Luncan

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


function request(url, callback) {

  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
	data = xhr.responseText;
	data = JSON.parse(data);
	if (data.errors) {
	  error(callback);
	}
	else {
	  if (callback == 'list') list();
	  else if (callback == 'process') process('add');
	}
      }
      else {
	error(callback);
      }
    }
  };
  xhr.onerror = function (e) {
    error(callback);
  };
  xhr.send(null);

}

function search(q) {

  var button_search = document.getElementById('button_search');
  button_search.value = 'Searching';
  button_search.disabled = true;

  // https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=Cheddar%20Cheese
	//var url = 'https://api.nal.usda.gov/fdc/v1/foods/search/?pageSize=100&api_key=' + api_key + '&query=' + q;
  var url = 'api/?q=' + q;
  //var url = '_info/s1.json';
  request(url, 'list');

}

function list() {

  var button_search = document.getElementById('button_search');
  button_search.value = 'Search';
  button_search.disabled = false;

  var nl = document.createElement('br');
  form.appendChild(nl);

  var select_food = document.getElementById('select_food');
  var select_weight = document.getElementById('select_weight');
  if (select_food && select_weight) {
    select_food.innerHTML = '';
    select_weight.innerHTML = '';
  }
  else {
    select_food = document.createElement('select');
    select_food.className = 'select_food';
    select_food.id = 'select_food';
    form.appendChild(select_food);
    select_weight = document.createElement('select');
    select_weight.className = 'select_weight';
    select_weight.id = 'select_weight';
    form.appendChild(select_weight);
    var button_add = document.createElement('input');
    button_add.type = 'button';
    button_add.className = 'button';
    button_add.value = 'Add';
    button_add.id = 'button_add';
    form.appendChild(button_add);
    button_add.addEventListener('click', function() {
      add(document.getElementById('select_food').value);
    }, false);
  }
  var name, ndbno, option;
  for (var i = 0; i < data.foods.length; i++) {
    name = data.foods[i]['description'];
    ndbno = data.foods[i]['fdcId'];
    option = document.createElement('option');
    option.value = ndbno;
    option.innerHTML = name;
    select_food.appendChild(option);
  }
  for (var i = 1; i <= weights; i++) {
    option = document.createElement('option');
    option.value = i * weightp;
    option.innerHTML = i * weightp + 'g';
    if (option.value == 100) option.selected = 'selected';
    select_weight.appendChild(option);
  }

}

function add(ndbno) {

  var button_add = document.getElementById('button_add');
  button_add.value = 'Adding';
  button_add.disabled = true;

  // https://api.nal.usda.gov/fdc/v1/food/######?api_key=DEMO_KEY
  var url = 'https://api.nal.usda.gov/fdc/v1/food/' + ndbno + '?api_key=' + api_key;
  //var url = '_info/s21.json';
  request(url, 'process');

}

function remove(food) {

  delete db[food];

  process('remove');

}

function process(method) {

  if (method == 'add') {

    var button_add = document.getElementById('button_add');
    button_add.value = 'Add';
    button_add.disabled = false;

    var select_food = document.getElementById('select_food')
    var food = select_food[select_food.selectedIndex].text;
    var weight = document.getElementById('select_weight').value;

    db[food] = {};
    db[food]['weight'] = weight;

    var name, unit, value;
    for (var i = 0; i < data.report.food.nutrients.length; i++) {
      name = data.report.food.nutrients[i]['name'];
      unit = data.report.food.nutrients[i]['unit'];
      value = data.report.food.nutrients[i]['value'];
      if (name == 'Energy' && unit != 'kcal') continue;
      if (unit == 'g') value = value * 1000000;
      if (unit == 'mg') value = value * 1000;
      if (value > 0 && (value.toString().indexOf('.') != -1 || (weight / 100).toString().indexOf('.') != -1)) {
	value = parseFloat(value * weight / 100).toFixed(3);
	value = value.toString().replace(/0+$/, '');
	value = value.toString().replace(/\.$/, '');
      }
      else {
	value = value * weight / 100;
      }
      if (value.toString().indexOf('.') == -1) {
	value = parseInt(value);
      }
      db[food][name] = value;
    }

  }

  db['total'] = {};
  db['total']['weight'] = 0;
  var v;
  for (var e in db) {
    if (e == 'total') continue;
    for (var n in db[e]) {
      v = db[e][n];
      if (db['total'][n]) {
	if (v.toString().indexOf('.') != -1 || db['total'][n].toString().indexOf('.') != -1) {
	  db['total'][n] = (parseFloat(db['total'][n]) + parseFloat(v)).toFixed(3);
	}
	else db['total'][n] += parseInt(v);
      }
      else db['total'][n] = parseInt(v);
    }
  }

  show();

}

function show() {

  table.innerHTML = '';

  var stage = document.getElementById('select_stage').value;

  var cell, nl;

  // Foods
  cell = document.createElement('div');
  cell.innerHTML = 'Food';
  cell.className = 'food_header';
  table.appendChild(cell);
  cell = document.createElement('div');
  cell.innerHTML = 'Weight';
  cell.className = 'weight_header';
  table.appendChild(cell);
  for (var e in db) {
    if (e == 'total') continue;
    nl = document.createElement('br');
    table.appendChild(nl);
    cell = document.createElement('div');
    cell.innerHTML = e;
    cell.className = 'food';
    table.appendChild(cell);
    cell = document.createElement('div');
    cell.innerHTML = db[e]['weight'] + 'g';
    cell.className = 'weight';
    table.appendChild(cell);
    cell = document.createElement('div');
    cell.innerHTML = 'x';
    cell.className = 'food_remove';
    cell.addEventListener('click', function(e) {
      remove(e);
    }.bind(this, e), false);
    table.appendChild(cell);
  }

  nl = document.createElement('br');
  table.appendChild(nl);
  nl = document.createElement('br');
  table.appendChild(nl);

  // Total
  var uvalue = 0;
  var ovalue = 0;
  var cvalue = 0;
  var avalue = 0;
  var tvalue = 0;
  cell = document.createElement('div');
  cell.innerHTML = 'Total';
  cell.className = 'food_header';
  table.appendChild(cell);
  cell = document.createElement('div');
  cell.innerHTML = db['total']['weight'] + 'g';
  cell.className = 'weight_header';
  table.appendChild(cell);
  nl = document.createElement('br');
  table.appendChild(nl);
  for (var ng in nutrients) {
    nl = document.createElement('br');
    table.appendChild(nl);
    cell = document.createElement('div');
    cell.innerHTML = ng;
    cell.className = 'nutrient_group';
    table.appendChild(cell);
    for (var n in nutrients[ng]) {
      cell = document.createElement('div');
      cell.innerHTML = n;
      cell.className = 'nutrient_' + ng.toLowerCase() + '_header';
      cell.title = nutrients[ng][n]['name'];
      table.appendChild(cell);
    }
    nl = document.createElement('br');
    table.appendChild(nl);
    // Adequate Values
    cell = document.createElement('div');
    cell.innerHTML = 'Adequate';
    cell.className = 'nutrient_group_adequate';
    table.appendChild(cell);
    for (var n in nutrients[ng]) {
      cell = document.createElement('div');
      avalue = intake[ng][n][stage]['adequate'];
      cell.innerHTML = (avalue > 0) ? convert(avalue, n) : 'ND';
      cell.className = 'nutrient_' + ng.toLowerCase();
      table.appendChild(cell);
    }
    nl = document.createElement('br');
    table.appendChild(nl);
    // Tolerable Values
    cell = document.createElement('div');
    cell.innerHTML = 'Tolerable';
    cell.className = 'nutrient_group_tolerable';
    table.appendChild(cell);
    for (var n in nutrients[ng]) {
      cell = document.createElement('div');
      tvalue = intake[ng][n][stage]['tolerable'];
      cell.innerHTML = (tvalue > 0) ? convert(tvalue, n) : 'ND';
      cell.className = 'nutrient_' + ng.toLowerCase();
      table.appendChild(cell);
    }
    nl = document.createElement('br');
    table.appendChild(nl);
    // Current Values
    cell = document.createElement('div');
    cell.innerHTML = 'Current';
    cell.className = 'nutrient_group_current';
    table.appendChild(cell);
    for (var n in nutrients[ng]) {
      cell = document.createElement('div');
      cvalue = db['total'][nutrients[ng][n]['pattern']];
      cell.innerHTML = convert(cvalue, n);
      // uvalue = adequate - (adequate * 20/100)
      // ovalue = adequate + (tolerable - adequate) * 50/100
      // 0 < uvalue <= value <= ovalue < tolerable
      if (!cvalue) cvalue = 0;
      avalue = intake[ng][n][stage]['adequate'];
      if (avalue < 0) avalue = 0;
      tvalue = intake[ng][n][stage]['tolerable'];
      if (tvalue < 0) {
	tvalue = (avalue > 0) ? avalue * 100 : 1000000000000;
      }
      uvalue = avalue - (avalue * 20 / 100);
      ovalue = avalue + ((tvalue - avalue) * 50 / 100);
      if (cvalue < uvalue) {
	cell.className = 'nutrient_' + ng.toLowerCase() + ' nutrient_warning';
      }
      else if (uvalue <= cvalue && cvalue <= ovalue) {
	cell.className = 'nutrient_' + ng.toLowerCase() + ' nutrient_good';
      }
      else if (cvalue >= tvalue) {
	cell.className = 'nutrient_' + ng.toLowerCase() + ' nutrient_alert';
      }
      else {
	cell.className = 'nutrient_' + ng.toLowerCase() + ' nutrient_warning';
      }
      table.appendChild(cell);
    }
    nl = document.createElement('br');
    table.appendChild(nl);
  }

}

function convert(value, name) {

  if (value) {
    if (name != 'Energy') {
      if (value >= 1000000) value = value / 1000000 + 'g';
      else if (value >= 1000) value = value / 1000 + 'mg';
      else {
	if (value.toString().indexOf('.') != -1) value = value.toString().replace(/0+$/, '');
	  value = value + '\u00b5g';
	}
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

function error(callback) {

  var mess = document.createElement('div');
  mess.className = 'error';
  if (callback == 'list') {
    mess.innerHTML = 'The search failed. Try searching something else or try again layer.';
    var button_search = document.getElementById('button_search');
    button_search.value = 'Search';
    button_search.disabled = false;
  }
  else if (callback == 'process') {
    mess.innerHTML = 'Failed to add this food. Try to add something else or try again later.';
    var button_add = document.getElementById('button_add');
    button_add.value = 'Add';
    button_add.disabled = false;
  }
  mess.addEventListener('click', function () {
    document.body.removeChild(this);
    mess = null;
  }, false);
  setTimeout(function() {
    if (mess) document.body.removeChild(mess);
  }, 5000);
  document.body.appendChild(mess);

}

function init() {

  var option_stage, select_stage = document.createElement('select');
  select_stage.className = 'select_stage';
  select_stage.id = 'select_stage';
  for (var s in stages) {
    option_stage = document.createElement('option');
    option_stage.value = s;
    option_stage.innerHTML = stages[s];
    select_stage.appendChild(option_stage);
  }
  header.appendChild(select_stage);
  select_stage.addEventListener('change', function(i) {
    show();
  }, false);

  var input_search = document.createElement('input');
  input_search.type = 'text';
  input_search.value = input_search_text;
  input_search.id = 'input_search';
  input_search.className = 'input';
  form.appendChild(input_search);
  input_search.addEventListener('focus', function(i) {
    if (this.value == input_search_text) {
      this.value = '';
      this.style.color = '#336699';
    }
  }, false);

  var button_search = document.createElement('input');
  button_search.type = 'button';
  button_search.className = 'button';
  button_search.value = 'Search';
  button_search.id = 'button_search';
  form.appendChild(button_search);
  button_search.addEventListener('click', function() {
    var input_search = document.getElementById('input_search');
    if (input_search.value != '' && input_search.value != input_search_text) {
      search(input_search.value);
    }
  }, false);

  show();

}


var api_key = 'DEMO_KEY';

var data;
var input_search_text = 'Enter one or more terms, eg: raw broccoli';

var weights = 100;
var weightp = 10;

var db = {};
db['total'] = {};
db['total']['weight'] = 0;

var header = document.getElementById('header');
var form = document.getElementById('form');
var table = document.getElementById('table');

init();
