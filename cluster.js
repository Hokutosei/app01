var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

if(cluster.isMaster) {
    //fork workers.
    for(var i =  0; i < numCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
    });
} else {
    // workers can share any tcp connection
    // in this case its a http server
    http.createServer(function(req, res) {
        res.writeHead(200);
        res.end("hello world\n");

    }).listen(9000);
}