var express = require("express");
var app = express();
app.use(express.logger());

var redis = require('redis'),
    client = redis.createClient(14396, 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com');
client.auth('jinpol', function(err, res) {
    if (err) {
        console.log('auth error ' + err)
    } else { console.log('authorized..') }
})


app.use(express.compress());
var oneDay = 86400000;

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));


var port = process.env.PORT || 4000;
app.listen(port, function() {
    console.log('Listening on ' + port)

})