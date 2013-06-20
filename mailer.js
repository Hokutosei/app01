var nodemailer = require("nodemailer");

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "jeanepaul@gmail.com",
        pass: "jeanepaulsoliva"
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: "jeanepaul ✔ <jeanepaul@gmail.com>", // sender address
    to: "jeanepaul@gmail.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world ✔", // plaintext body
    html: "<b>Hello world ✔</b>" // html body
}

// send mail with defined transport object
//smtpTransport.sendMail(mailOptions, function(error, response){
//    if(error){
//        console.log(error);
//    }else{
//        console.log("Message sent: " + response.message);
//    }
//
//    // if you don't want to use this transport object anymore, uncomment following line
//    //smtpTransport.close(); // shut down the connection pool, no more messages
//});


var fs = require("fs")
    , url = require('url')
    , host = "127.0.0.1"
    , port = 1337
    , express = require("express")
    , app = express()
    , redis = require('redis')
    , globalIp = '60.148.89.178' || '10.0.1.2';


//app.use(app.router);
 app.use(express.bodyParser());//use both root and other routes below
//app.use(express.static(__dirname + "/public")); //use static files in ROOT/public folder

var client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
    if(err) { console.log('could not connect to redis server') }
});



app.get("/", function(request, response){ //root dir
    response.send("Hello!!");
});

app.post('/sendmail', function(request, response) {
    request.on('data', function(chunk) {
        console.log(parseDataFromUrl(chunk))
        var data = parseDataFromUrl(chunk)
        console.log(data['id'])

        client.hgetall(query(data['mainKey'], data['id'], data['dataKey']), function(err, hgetAllReply) {
            console.log(hgetAllReply)
        })

    })

})

function parseDataFromUrl(chunk) {
    var query = chunk.toString(), data = query.split("&"), result = {};
    for(var i = 0; i < data.length; i++) {
        var item = data[i].split("=");
        result[item[0]] = item[1];
    }
    return result;
}

function parseInfo( info ) {
    var lines = info.split( "\r\n" );
    var obj = { };
    for ( var i = 0, l = info.length; i < l; i++ ) {
        var line = lines[ i ];
        if ( line && line.split ) {
            line = line.split( ":" );
            if ( line.length > 1 ) {
                var key = line.shift( );
                obj[ key ] = line.join( ":" );
            }
        }
    }
    return obj;
}

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}



app.listen(port, host);
console.log('Server now listening to ' + host + ' : ' + port)