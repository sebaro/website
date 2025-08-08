/*
	@licstart  The following is the entire license notice for the
	JavaScript code in this page.

	Copyright (C) 2025 Sebastian Luncan

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


var engines = {
	'Google': {
		'Web': 'https://www.google.com/search?udm=14&q=',
		'Images': 'https://www.google.com/search?udm=2&q=',
		'Videos': 'https://www.google.com/search?udm=7&q='
	},
	'Bing': {
		'Web': 'https://www.bing.com/?scope=web&q=',
		'Images': 'https://www.bing.com/images/search?q=',
		'Videos': 'https://www.bing.com/videos/search?q='
	},
	'Brave': {
		'Web': 'https://search.brave.com/search?source=web&q=',
		'Images': 'https://search.brave.com/images?q=',
		'Videos': 'https://search.brave.com/videos?q='
	},
	'Mojeek': {
		'Web': 'https://www.mojeek.com/search?q=',
		'Images': 'https://www.mojeek.com/search?fmt=images&q='
	},
	'Yandex': {
		'Web': 'https://yandex.com/search/?text=',
		'Images': 'https://yandex.com/images/search?text=',
		'Videos': 'https://yandex.com/video/search?text='
	},
	'IMDb': {
		'Web': 'https://www.imdb.com/find/?q='
	},
	'TMDB': {
		'Web': 'https://www.themoviedb.org/search?query='
	},
	'Wikipedia': {
		'Web': 'https://en.wikipedia.org/w/index.php?search='
	}
};

var searchq = document.getElementById('searchq');
var searchb = document.getElementById('searchb');
var searcht = document.getElementById('searcht');
var searche = document.getElementById('searche');

function openUrl () {
	var url = engines[searche.value][searcht.value] || engines[searche.value]['Web'];
	var query = searchq.value.replace(/\s+/, '+').trim();
	window.open(url + query);
}

var enginez = Object.keys(engines);
var option;

for (var i = 0; i < enginez.length; i++) {
	option = document.createElement('option');
	option.value = enginez[i];
	option.textContent = enginez[i];
	searche.appendChild(option);
}

searchq.focus();

searchq.addEventListener('keyup', function(event) {
	if (event.key === 'Enter' || event.keyCode === 13) {
		openUrl();
	}
});

searchb.addEventListener('click', function() {
	openUrl();
}, false);
