// http://nodejs.org/api.html#_child_processes
var sys = require('sys')
var exec = require('child_process').exec;
var child;


var fs = require("fs")
    , url = require('url')
    , host = "localhost"
    , port = 10000
    , express = require("express")
    , app = express()
    , redis = require('redis')
    , globalIp = '60.148.89.178' || '10.0.1.2'
    , jpUtils = require('./utils');


//app.use(app.router);
app.use(express.bodyParser());//use both root and other routes below

app.post('/gitpull', function(request, response) {
    jpUtils.log('gitpull!!')

})



// executes `pwd`
//child = exec("git pull", function (error, stdout, stderr) {
//    sys.print('stdout: ' + stdout);
//    sys.print('stderr: ' + stderr);
//    if (error !== null) {
//        console.log('exec error: ' + error);
//    }
//});

app.listen(port, host);
console.log('Server now listening to ' + host + ' : ' + port)