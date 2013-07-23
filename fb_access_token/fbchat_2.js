var FacebookChat = require("facebook-chat");

var params = {
    facebookId : '1638322655',
    appId : '316661848467900',
    secret_key : '1ac6a50ef0d6c6f6ba14b2079f2e3672',
    accessToken : 'CAAEgAJT96bwBANmBzkmIB1FcE40GLfStmMge8OZApZB5B4Sv8vMwkTZBh3AUwBu4hXgOJYnvwE69I5ZAUvGudPod8rhiBHMRdOdT0r7AxPrOLp0VkrHayJattkIZCJh9njsmTBye6ZAdxB4I5OcEufJPO3X5L6jCEZD'
};

var facebookClient = new FacebookChat(params);
facebookClient.on('online', function(){
    //Get friend list
    facebookClient.roster();

    //Send a message
//    facebookClient.send('-100003767773164@chat.facebook.com', 'test');

    //Get a vcard
//    facebookClient.vcard();

    //Get a friend vcard
//    facebookClient.vcard('-FACEBOOK_ID@chat.facebook.com');
});

facebookClient.roster();

//Send a message
facebookClient.send('-100003767773164@chat.facebook.com', 'test');


facebookClient.on('message', function(message){
    console.log(message);
});
//
//facebookClient.on('presence', function(presence){
//    console.log(presence);
//});
//
//facebookClient.on('roster', function(roster){
//    console.log(roster);
//});
//
//facebookClient.on('vcard', function(vcard){
//    console.log(vcard);
//});
//
//facebookClient.on('composing', function(from){
//    console.log(from + ' compose a message');
//});

var msg = []

var readline = require('readline'),
    rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: false});

rl.setPrompt('jeanepaulFb> ');
rl.prompt();

rl.on('line', function(line) {
    console.log(line)
    facebookClient.send('-100003767773164@chat.facebook.com', line.trim());

    rl.prompt();
}).on('close', function() {
        console.log('Have a great day!');
        process.exit(0);
    });

facebookClient.on('message', function(message){
    console.log(message);
//    rl.setPrompt('Testing')
});
