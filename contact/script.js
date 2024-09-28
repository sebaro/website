
function create(type, properties, event, listener) {
	var obj = document.createElement(type);
	for (var propertykey in properties) {
		obj[propertykey] = properties[propertykey];
	}
	if (event && listener) {
		obj.addEventListener(event, listener, false);
	}
	return obj;
}

function request(post) {
	var url = 'https://sebaro-apps.vercel.app/api/contact';
	//var url = './messages.php';
	var xhr = new XMLHttpRequest();
	var method = 'GET';
	if (post) {
		method = 'POST';
		post = JSON.stringify(post);
	}
	else {
		post = null;
	}
	xhr.open(method, url, true);
	xhr.onload = function (e) {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				try {
					data = JSON.parse(this.responseText);
				}
				catch(e) {
					data = [];
					warn = 'Request failed, try again later';
				}
				respond(post);
			}
			else {
				data = [];
				warn = xhr.statusText;
				if (!warn) warn = 'Request failed, try again later';
				respond(post);
			}
		}
	};
	xhr.onerror = function (e) {
		data = [];
		warn = xhr.statusText;
		if (!warn) warn = 'Request failed, try again later';
		respond(post);
	};
	xhr.send(post);
}

function show() {
	var mbox, mid, msubject, mauthor, mcontent, mdate, mstyle, osubject, obox;
	var rbox, rbutton;
	var dates = {};
	var subjects = [];
	var active = [];
	var archive = [];
	var threshold = 100, days, sd, cd = new Date().getTime();
	var ns, nl;
	for (var i = 0; i < data.length; i++) {
		dates[data[i]['subject']] = data[i]['date'];
	}
	for (var entry in dates) {
		subjects.push({'title': entry, 'date': dates[entry]});
	}
	subjects.sort(function(a, b) {
		return a['date'].replace(/[^\d]/g, '') - b['date'].replace(/[^\d]/g, '');
	});
	for (var i = 0; i < subjects.length; i++) {
		days = 0;
		try {
			sd = new Date(subjects[i]['date'].replace('/', 'T')).getTime();
			days = (cd / 1000 - sd / 1000 ) / (60 * 60 * 24);
		}
		catch(e) {}
		if (days <= threshold) {
			active.push(subjects[i]['title']);
		}
		else {
			archive.push(subjects[i]['title']);
		}
	}
	active = active.reverse();
	for (var i = 0; i < active.length; i++) {
		ns = true;
		for (var j = 0; j < data.length; j++) {
			if (data[j]['subject'] == active[i]) {
				mstyle = (ns) ? "entry" : "rentry";
				mid = data[j]['author'] + '@' + data[j]['date'];
				mbox = create('div', {className: mstyle, id: mid});
				mstyle = (data[j]['author'] == 'sebaro') ? "authori" : "author";
				mauthor = create('div', {className: mstyle, textContent: data[j]['author']});
				mcontent = data[j]['message'];
				if (mcontent) mcontent = mcontent.replace(/(https?:\/\/([-\w\.]+[-\w])+(:\d+)?(\/([\w/_\.#-\@~]*(\?\S+)?[^\.,\s\)])?)?)/g, '<a href="$1">$1</a>');
				mcontent = create('div', {className: 'message', innerHTML: mcontent});
				mdate = create('div', {className: 'date', textContent: data[j]['date']});
				if (ns) {
					msubject = create('div', {className: 'subject', textContent: data[j]['subject']});
					mbox.appendChild(msubject);
				}
				mbox.appendChild(mauthor);
				mbox.appendChild(mdate);
				mbox.appendChild(mcontent);
				messages.appendChild(mbox);
				nl = create('br');
				messages.appendChild(nl);
				ns = false;
			}
		}
		rbox = create('div', {className: 'rbox'});
		rbutton = create('div', {className: 'rbutton', textContent: 'Reply'}, 'click', function() {
			window.scrollTo(0, 0);
			author.focus();
			author.value = ''
			author.value = 'Author';
			subject.value = active[this];
		}.bind(i));
		rbox.appendChild(rbutton);
		messages.appendChild(rbox);
		nl = create('br');
		messages.appendChild(nl);
	}
	if (archive.length > 0) {
		nl = create('br');
		messages.appendChild(nl);
		nl = create('br');
		messages.appendChild(nl);
	}
	archive = archive.reverse();
	for (var i = 0; i < archive.length; i++) {
		osubject = create('div', {className: 'osubject', textContent: archive[i]}, 'click', function() {
			var mstyle = document.getElementById('oldmessage' + this).style.display;
			if (!mstyle || mstyle == 'none') document.getElementById('oldmessage' + this).style.display = 'block';
			else if (mstyle == 'block') document.getElementById('oldmessage' + this).style.display = 'none';
		}.bind(i));
		messages.appendChild(osubject);
		obox = create('div', {className: 'omessage', id: 'oldmessage' + i});
		messages.appendChild(obox);
		ns = true;
		for (var j = 0; j < data.length; j++) {
			if (data[j]['subject'] == archive[i]) {
				mstyle = (ns) ? "oentry" : "rentry";
				mid = data[j]['author'] + '@' + data[j]['date'];
				mbox = create('div', {className: mstyle, id: mid});
				mstyle = (data[j]['author'] == 'sebaro') ? "authori" : "author";
				mauthor = create('div', {className: mstyle, textContent: data[j]['author']});
				mcontent = data[j]['message'];
				if (mcontent) mcontent = mcontent.replace(/(https?:\/\/([-\w\.]+[-\w])+(:\d+)?(\/([\w/_\.#-\@~]*(\?\S+)?[^\.,\s\)])?)?)/g, '<a href="$1">$1</a>');
				mcontent = create('div', {className: 'message', innerHTML: mcontent});
				mdate = create('div', {className: 'date', textContent: data[j]['date']});
				mbox.appendChild(mauthor);
				mbox.appendChild(mdate);
				mbox.appendChild(mcontent);
				obox.appendChild(mbox);
				ns = false;
			}
		}
		nl = create('br');
		messages.appendChild(nl);
		nl = create('br');
		messages.appendChild(nl);
	}
	if (id) {
		window.location.hash = '#' + id;
		id = '';
	}
}

function respond(post) {
	submit.value = 'Send';
	messages.innerHTML = '';
	if (!warn) {
		author.value = 'Author';
		subject.value = 'Subject';
		message.value = 'Message';
		if (data.length > 0) {
			show();
		}
		else {
			messages.appendChild(create('div', {className: 'entry warn', textContent: 'No messages'}));
		}
	}
	else {
		if (post) {
			error.textContent = warn;
			error.style.display = 'inline-block';
		}
		messages.appendChild(create('div', {className: 'entry warne', textContent: warn}));
	}
}

var messages = document.getElementById('messages');
var author = document.getElementById('author');
var subject = document.getElementById('subject');
var message = document.getElementById('message');
var submit = document.getElementById('submit');
var error = document.getElementById('error');

var data;
var post = {};
var warn;
var id = '';

submit.addEventListener('click', function() {
	warn = '';
	error.style.display = 'none';
	if (!author.value || author.value.toLowerCase() == 'author' || /[^a-zA-Z0-9 ~\!@#\$&\-_\.]/.test(author.value) || /(\n|\r)/.test(author.value)) {
    warn = "Author field is missing or contains illegal characters!";
  }
	if (!subject.value || subject.value.toLowerCase() == 'subject' || /[^a-zA-Z0-9 ~\!@#\$&\-_\.]/.test(subject.value) || /(\n|\r)/.test(subject.value)) {
    warn = "Subject field is missing or contains illegal characters!";
  }
	if (!message.value || message.value.toLowerCase() == 'message') {
    warn = "Message field is missing!";
  }
  if (!warn) {
		post['author'] = author.value.replace('&amp;', '&').replace('&', '&amp;').trim();
		post['subject'] = subject.value.replace('&amp;', '&').replace('&', '&amp;').trim();
		post['message'] = message.value.replace('&amp;', '&').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(/\r/g, '');
		post['date'] = new Date().toISOString().replace(/:[^:]+$/, '').replace('T', '/');
		warn = '';
		error.style.display = 'none';
		data = [];
		id = post['author'] + '@' + post['date'];
		submit.value = 'Sending';
		request(post);
	}
	else {
		error.textContent = warn;
		error.style.display = 'inline-block';
	}
}, false);

messages.appendChild(create('div', {className: 'entry warn', textContent: 'Loading...'}));
request();
//show();
