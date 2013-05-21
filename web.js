var express = require("express");
var app = express();
app.use(express.logger());

//app.get('/', function(request, response) {
//  response.send('Hello World!');
//});
//
//var port = process.env.PORT || 4000;
//app.listen(port, function() {
//  console.log("Listening on " + port);
//});

app.use(express.compress());
var oneDay = 86400000;

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));


var port = process.env.PORT || 4000;
app.listen(port, function() {
    console.log('Listening on ' + port)

})