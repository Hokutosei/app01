var cluster = require('cluster');

if(cluster.isWorker) {
    console.log('I am worker ' + cluster.worker.id);

    var timeouts = [];
    function errorMsg() {
        console.error("Something must be wrong with the connection ...");
    }

    cluster.on('fork', function(worker) {
        timeouts[worker.id] = setTimeout(errorMsg, 2000);
    });
    cluster.on('listening', function(worker, address) {
        clearTimeout(timeouts[worker.id]);
    });
    cluster.on('exit', function(worker, code, signal) {
        clearTimeout(timeouts[worker.id]);
        errorMsg();
    });
}