
/*

 This example is showing how to use this module to connect with facebook chat

 The example will create website that allow user to:
 - login with facebook through oauht (and express.js)
 - listen to facebook chat via Socket IO

 require - express (http://expressjs.com)
 - socket.io (http://socket.io)
 */

var util = require('util');
var url  = require('url');
var express  = require('express');

var FacebookChat = require('./fb-client');
var config = require('./config');

//Http Server
var app = express();
app.use(express.cookieParser());
//app.use("/static", express.static(__dirname + '/static'));
app.listen(8085);

//Create OAuth Instance
var facebook_chat = new FacebookChat(
    config.consumer_key,
    config.consumer_secret);

console.log(facebook_chat)

app.all('/authentication', function(req, res){
    console.log(req)

    if(!req.query.code){
        console.log('Redirect the user to Authentication From')
        var redirecUrl = facebook_chat.oAuthRedirectUrl('http://localhost:8085/authentication')
        res.redirect(redirecUrl);

    }else{
        console.log('Get access_token from the code')
        facebook_chat.oAuthGetAccessToken(req.query, function(err, access_token, refresh_token) {

            if(err) return res.send(500,err);
            return res.redirect('/?access_token='+access_token);
        });
    }
});
