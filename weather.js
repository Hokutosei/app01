var http = require('http'),
    redis = require('redis'),
    queryString = require('querystring');

var loop_delay = 720000, counter = 0, serverStart = new Date();

var globalIp = '60.148.89.178' || '10.0.1.2';
var redis = require('redis');
var client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
    if(err) { console.log('could not connect to redis server') }
});


var cluster = require('cluster');
var cpuCount = require('os').cpus().length;

// Code to run if we're in the master process
if (cluster.isMaster) {

    // Count the machine's CPUs

    // Create a worker for each CPU
    for (var i = 0; i < 1; i += 1) {
        cluster.fork();
    }
    console.log('Master is working.. ' + cluster)
} else {

    console.log('Working ' + cluster.worker.id + ' Running!')
    main()

}


function main() {
    var fetchUrl = [
        { 'weather-akiruno': 'http://api.openweathermap.org/data/2.5/weather?q=Akiruno-shi' },
        { 'currency-yen-php': 'http://rate-exchange.appspot.com/currency?from=JPY&to=PHP'},
        { 'weather-paranaque' : 'http://api.openweathermap.org/data/2.5/weather?q=Parañaque'}
    ]

    var mainKey = 'analytics-info'

    function initializeKey() {
        client.get(query(mainKey, 'id'), function(err, getReply) {
            if(getReply == null) {
                client.set(query(mainKey, 'id'), '0', redis.print)
            }
            initializer()
        })
    }

    function initializer() {
        client.get(query('weather', 'interval', 'time'), function(err, intervalTime) {
            var processor = cluster.isMaster == true ? 'Master process' : cluster.worker.id
            console.log('Triggering getdata() in... ' + intervalTime + ' from cluster worker id ' + cluster.worker.id + ' / ' + cpuCount)
            setTimeout(getData, intervalTime)
        })
    }

    initializeKey()
    function getData() {
        client.get(query(mainKey, 'id'), function(err, getReply) {
            for(var i = 0; i < fetchUrl.length; i++) {
                for(key in fetchUrl[i]) {
                    switch (key.toString()) {
                        case 'weather-akiruno':
                            console.log('weather');
                            getRequest(fetchUrl[i]['weather-akiruno'], 'weather-akiruno', function(data) {
                                var weatherData = {
                                    'main-temp'             : (data['main'].temp - 273.15).toFixed(2),
                                    'main-temp_min'         : (data['main'].temp_min - 273.15).toFixed(2),
                                    'main-temp_max'         : (data['main'].temp_max - 273.15).toFixed(2),
                                    'weather-main'          : data['weather'][0].main,
                                    'weather-description'   : data['weather'][0].description,
                                    'time'                  : new Date()
                                }
                                console.log(weatherData)
                                client.hmset(query(mainKey, getReply, 'weather-akiruno'), weatherData, function(err, hmsetReply) {
                                    console.log(hmsetReply);
                                    client.get(query(mainKey, 'id'), function(err, getReply) {
                                        makePost(getReply, mainKey, 'weather-akiruno');
                                    })
                                })
                            });
                            break;
                        case 'weather-paranaque':
                            console.log('weather');
                            getRequest(fetchUrl[i]['weather-paranaque'], 'weather-paranaque', function(data) {
                                var weatherData = {
                                    'main-temp'             : (data['main'].temp - 273.15).toFixed(2),
                                    'main-temp_min'         : (data['main'].temp_min - 273.15).toFixed(2),
                                    'main-temp_max'         : (data['main'].temp_max - 273.15).toFixed(2),
                                    'weather-main'          : data['weather'][0].main,
                                    'weather-description'   : data['weather'][0].description,
                                    'time'                  : new Date()
                                }
                                console.log(weatherData)
                                client.hmset(query(mainKey, getReply, 'weather-paranaque'), weatherData, function(err, hmsetReply) {
                                    console.log(hmsetReply);
                                    client.get(query(mainKey, 'id'), function(err, getReply) {
                                        makePost(getReply, mainKey, 'weather-paranaque');
                                    })
                                })
                            });
                            break;

                        case 'currency-yen-php':
                            console.log('currency');
                            getRequest(fetchUrl[i]['currency-yen-php'], 'currency-yen-php', function(data) {
                                var pesoCurrency = {
                                    'currency'  :   data['rate'],
                                    'from'      :   data['from'],
                                    'to'        :   data['to'],
                                    'time'      :   new Date()
                                }
                                console.log(pesoCurrency)
                                client.hmset(query(mainKey, getReply, 'currency-yen-php'), pesoCurrency, function(err, hmsetReply) {
                                    client.get(query(mainKey, 'id'), function(err, getReply) {
                                        makePost(getReply, mainKey, 'currency-yen-php')
                                    })
                                })
                                client.get(query(mainKey, 'id'), function(err, getReply) {
                                    console.log('getreply ' + getReply)
                                    var recentId = getReply - 1;
                                    client.hget(query(mainKey, recentId, 'currency-yen-php'), 'currency', function(err, hgetReply) {
                                        console.log('Peso Currency current: ' + pesoCurrency['currency'] + ' recent: ' + hgetReply )
                                    })
                                })
                            });
                            break;
                    }

                }
                if(i == fetchUrl.length -1 ) {
                    client.multi()
                        .lpush(query(mainKey, 'id.list'), getReply)
                        .incr(query(mainKey, 'id'))
                        .exec(redis.print)
                    console.log(serverStart)
                    initializer()
                }
            }
        })
    }
//getData();
//setInterval(function() { getData() }, loop_delay)



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

    function getRequest(url, key, fn) {
        var dataArray = {}
        http.get(url, function(response) {
            console.log(response.statusCode)
            if(response.statusCode == 200) {
                // fix here
                response.on('data', function(chunk) {
                    var data = JSON.parse(chunk)
                    console.log(data)
                    console.log('====================== ' + key)
                    var counter = 1;
                    for(keys in data) {
                        dataArray[keys] = data[keys.toString()]
                        counter++;
                        if(counter == Object.keys(data).length) {
                            return fn(dataArray)
                        }
                    }
                })
            } else {
                console.log('Error: ' + key + ' has: ' + response.statusCode + (new Date()).toString().replace('GMT+0900 (JST)', ''))
            }
        })
        .on('error', function(e) {
            console.log('Got error: ' + e.message)
        })
    }

    function query() {
        var arr = [];
        for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
        return arguments.length == 1 ? arr[0] : arr.join(':');
    }


    function makePost(id, mainKey, dataKey) {
        var options = {
            hostname    : '10.0.1.3',
            port        : 1337,
            path        : '/sendmail',
            method      : 'POST'
        };

        var req = http.request(options, function(res) {
            res.on('data', function(chunk) {
                console.log('Response: ' + chunk)
            })
        });

        req.on('error', function(e) {
            console.log(e)
        })

        var sendDataString = queryString.stringify({ id: id, mainKey: mainKey, dataKey: dataKey})

        req.write(sendDataString);
        req.end();
    }
}