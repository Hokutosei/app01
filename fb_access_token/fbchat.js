var util = require('util');
var url  = require('url');
var xmpp = require('node-xmpp');
var FacebookChat = require('./fb-chat');

var express  = require('express');
var app = express();
app.listen(8085);


var log = function(str) {
    console.log(str)
}

var testToken = 'CAAEgAJT96bwBANmBzkmIB1FcE40GLfStmMge8OZApZB5B4Sv8vMwkTZBh3AUwBu4hXgOJYnvwE69I5ZAUvGudPod8rhiBHMRdOdT0r7AxPrOLp0VkrHayJattkIZCJh9njsmTBye6ZAdxB4I5OcEufJPO3X5L6jCEZD'

var facebook_chat = new FacebookChat('316661848467900', '1ac6a50ef0d6c6f6ba14b2079f2e3672')

facebook_chat.getChatClient(testToken, function(err, client) {
//    console.log(client)

    client.on('stanza', function(stanza) {
        console.log(stanza)
    })

//    client.send(new xmpp.Element('message',
//        { to: '1638322655',
//            type: 'chat'
//        }).c('body').t('test'));

    client.on('message', function(message){
        console.log(message);
    });

    client.send('-1638322655@chat.facebook.com', 'test');
})



