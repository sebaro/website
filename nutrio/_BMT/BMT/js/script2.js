
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
	  else if (callback == 'process') show('add');
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

  var url = 'http://api.nal.usda.gov/ndb/search/?ds=Standard%20Reference&format=json&max=100&offset=0&api_key=' + api_key + '&q=' + q;
  //var url = 'info/s1.json';
  request(url, 'list');

}

function list() {

  var button_search = document.getElementById('button_search');
  button_search.value = 'Search';
  button_search.disabled = false;

  var nl = document.createElement('br');
  form.appendChild(nl);

  var select_food = document.getElementById('select_food');
  if (select_food) {
    select_food.innerHTML = '';
  }
  else {
    select_food = document.createElement('select');
    select_food.className = 'select_food';
    select_food.id = 'select_food';
    form.appendChild(select_food);
    var button_add = document.createElement('input');
    button_add.type = 'button';
    button_add.className = 'button';
    button_add.value = 'Show';
    button_add.id = 'button_add';
    form.appendChild(button_add);
    button_add.addEventListener('click', function() {
      add(document.getElementById('select_food').value);
    }, false);
  }
  var name, ndbno, option;
  for (var i = 0; i < data.list.item.length; i++) {
    name = data.list.item[i]['name'];
    ndbno = data.list.item[i]['ndbno'];
    option = document.createElement('option');
    option.value = ndbno;
    option.innerHTML = name;
    select_food.appendChild(option);
  }

}

function add(ndbno) {

  var button_add = document.getElementById('button_add');
  button_add.value = 'Searching';
  button_add.disabled = true;

  var url = 'http://api.nal.usda.gov/ndb/reports/?type=b&format=json&api_key=' + api_key + '&ndbno=' + ndbno;
  //var url = 'info/s21.json';
  request(url, 'process');

}

function show() {

  var button_add = document.getElementById('button_add');
  button_add.value = 'Show';
  button_add.disabled = false;

  var name, unit, value;
  for (var i = 0; i < data.report.food.nutrients.length; i++) {
    name = data.report.food.nutrients[i]['name'];
    unit = data.report.food.nutrients[i]['unit'];
    value = data.report.food.nutrients[i]['value'];
    if (name == 'Energy') {
      table.innerHTML = value + unit;
      break;
    }
  }

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

}


var api_key = 'DEMO_KEY';

var data;
var input_search_text = 'Enter one or more terms, eg: raw broccoli';

var form = document.getElementById('form');
var table = document.getElementById('table2');

init();
