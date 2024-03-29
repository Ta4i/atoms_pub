var express   = require('express'),
    path      = require('path'),
    fs        = require('fs'),
    WebSocket = require('ws'),
    MongoClient = require('mongodb').MongoClient;    


//create our express app
var app   = express(),
	wss   = null,
	ws    = null,
	users = {};
 
//add some standard express middleware
app.configure(function() {
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.static('static'));
    //setup our app to use handlebars.js for templating
	app.set('view engine', 'hbs');
	app.set('views', path.join(__dirname, 'views'));
});
 
// MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
// 	if(!err) {
// 		console.log("We are connected");
// 	}
// });

//routes
app.use('/static', express.static(__dirname + '/static'));

app.get('/coupons',function(req, res){
	console.log('_____________________________');
	for(var key in req){
		console.log('>>>>',key);
	}
	console.log('TTTTTTTTTTTTTTTTTTTTTTTTTTTTT');
})

app.get('/', function(req, res) {
    res.render('index', {'name': 'Name'});
});
app.get('/map', function(req, res) {
    res.render('map');
	if(wss === null){
	    startWebsocet();
	}
});
app.get('/pages', function(req, res) {
	fs.readdir('./atoms',function(err, files){
		var atoms = files.map(function(a){
			return a.split('.')[0];
		});
		console.log('Files',atoms)
	    res.render('pages',{atoms:atoms});
	});
});
app.get('/pages/:atomName', function(req, res) {
	var name = req.params.atomName;
	var url = '/atoms/' + name + '.js';
    res.render('atom',{url:url});
});
app.get('/atoms/:atomName', function(req, res) {
	res.sendfile('./atoms/' + req.params.atomName);
});
// app.get('/static/:path/:file', function(req, res) {
// 	res.sendfile('./static/' + req.params.path + '/' + req.params.file);
// });
//have our app listen on port 3000
app.listen(3000);
console.log('Your app is now running at: http://127.0.0.1:3000/');

function startWebsocet(){
	try{
		wss = new WebSocket.Server({
			port: 3001
		});
		wss.on('connection', function(_ws) {
			console.log('Connection WS Established.');
			ws = _ws;
		    ws.on('message', onWSMessage);
		    wss.broadcast = function(data) {
			  for (var i in this.clients)
			    this.clients[i].send(data);
			};
		});
	}catch(e){
		console.log(e);
	}
};
function onWSMessage(data){
	var message = JSON.parse(data);
	if(message && message.type && message.type === 'USER_COORDINATES'){
		console.log('USER_COORDINATES', message.lat, message.lng, message.sid);
		users[message.sid] = {
			lat: message.lat, 
			lng: message.lng
		};
		wss.broadcast(JSON.stringify({
	    	type: 'ALL_USERS',
	    	data: users
	    }));
	}
};