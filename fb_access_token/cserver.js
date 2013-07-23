var net = require('net');

var sockets = [];

var FacebookChat = require("facebook-chat");

var params = {
    facebookId : '1638322655',
    appId : '316661848467900',
    secret_key : '1ac6a50ef0d6c6f6ba14b2079f2e3672',
    accessToken : 'CAAEgAJT96bwBANmBzkmIB1FcE40GLfStmMge8OZApZB5B4Sv8vMwkTZBh3AUwBu4hXgOJYnvwE69I5ZAUvGudPod8rhiBHMRdOdT0r7AxPrOLp0VkrHayJattkIZCJh9njsmTBye6ZAdxB4I5OcEufJPO3X5L6jCEZD'
};

var facebookClient = new FacebookChat(params);
var s = net.Server(function(socket) {
    sockets.push(socket);

    socket.on('data', function(d) {
        console.log(d.toString())
        facebookClient.send('-100003767773164@chat.facebook.com', d.toString());
        for (var i = 0; i < sockets.length; i++) {
            if (sockets[i] == socket) continue;
            sockets[i].write(d);
        }
    });
    socket.on('end', function() {
        var i = sockets.indexOf(socket);
        sockets.splice(i, 1);
    });

    facebookClient.on('message', function(message){
        console.log(message['from'] + ' : ' + message['body'] + '\n');
        for (var i = 0; i < sockets.length; i++) {
            sockets[i].write(message['from'] + ' : ' + message['body'] + '\n');
        }
    });
});




s.listen(8000)