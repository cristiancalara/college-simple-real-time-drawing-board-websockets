'use strict';

var express = require('express'),
	nunjucksEngine = require('express-nunjucks'),
	events = require('events'),
	bodyParser = require('body-parser'),
	WebSocket = require('ws');

var app = express();

// allow using json post
app.use(bodyParser.json());

// set static assets path
app.use('/static', express.static(__dirname + '/public'));

app.set('views', __dirname + '/templates');
app.set('view engine', 'njk');

const njk = nunjucksEngine(app, {
	watch: true,
	noCache: true
});

app.get('/', function (req, res) {
	res.render('landing');
});


var wss = new WebSocket.Server({ port: 5000 });

// Broadcast to all.
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(line) {
		// Broadcast to everyone else.
		wss.clients.forEach(function each(client) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(line);
			}
		});
	});
});

var colors = ['#000000', '#A52A2A', '#228B22', '#191970', '#FF6347', '#FFD700'], index = 0;
app.get('/initialize', function (req, res) {
	var color = colors[index];
	if(index >= colors.length){
		index = 0;
	}
	index ++;

	res.json({
		color: color
	});
});

app.listen(3001, function () {
	console.log('The fronted server is running at port 3001')
});

exports.get = function () {
	return app;
};
