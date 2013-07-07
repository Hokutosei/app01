var redis = require('redis');
var globalIp = '60.148.89.178' || '10.0.1.2';
client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
    if(err) { console.log('could not connect to redis server') }
});

var mainKey = 'analytics-info', currencyKey = 'currency-yen-php';
var cluster = require('cluster');
var cpuCount = require('os').cpus().length;

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
    console.log('Master is working.. ' + cluster)
} else {

    console.log('Working ' + cluster.worker.id + ' Running!')
    function initializeMain() {
        console.log('initializing from worker ' + cluster.worker.id)
        main();
    }
    initializeMain()
}


var mainCounter = 0;
function main() {
    mainCounter++;
    client.get(query(mainKey, 'id'), function(err, getReply) {
        var rangeLength = 800
        var mean = getReply - rangeLength, data = [];
        client.hgetall(query(mainKey, getReply - 1, currencyKey), function(err, hgetReply) {
            // return if error
            if(err) { initializeMain(); return };
//            console.log(hgetReply['currency']);
            var startTime = new Date();
            for(var i = 0, counter = 0; i < rangeLength; i++) {
                client.hgetall(query(mainKey, mean + i, 'currency-yen-php'), function(err, hgetallReply) {
                    counter++;
                    if(hgetallReply != null) {
                        if(hgetallReply['currency'] != hgetReply['currency'] && data.contains(hgetallReply['currency'])) {
                            var date = hgetallReply['time'].toString().replace('GMT+0900 (JST)', '');
                            data.push({
                                currency    : hgetallReply['currency']
                                , date        : date
                            })
                        }
                    }
                    if(i == counter) {
                        for(var c = 0; c < data.length; c++) {
                            console.log('******************************************')
                            for(key in data.reverse()[c]) {
                                console.log(data[c][key]);

                            }
                            if(c == data.length - 1) {
                                var endTime = new Date() - startTime
                                client.get(query('recent_currency:interval'), function(err, getReply) {
                                    console.log('******************************************')
                                    console.log('Took ' + endTime + 'ms - MainCounter: ' + mainCounter +
                                        ' - current-currency: ' + hgetReply['currency'] + ' ' + formatTime(hgetReply['time']))
                                    console.log('setting timeout.. ' + getReply);
                                    setTimeout(initializeMain, getReply)
                                })
                            }
                        }
                    }
                })
            }
        })
    });

}



Array.prototype.contains = function(k) {
    for(var x = 0; x < this.length; x++) {
        if(this[x].currency == k) {
            return false
        }
    }
    return true
}

function formatTime(time) {
    return time.toString().replace('GMT+0900 (JST)', '')
}

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}
