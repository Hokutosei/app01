var http = require('http'),
    redis = require('redis'),
    queryString = require('querystring');

var loop_delay = 5000, counter = 0, serverStart = new Date();

var globalIp = '60.148.89.178' || '10.0.1.2';
var redis = require('redis');
var client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
    if(err) { console.log('could not connect to redis server') }
});


var fetchUrl = [
    { 'weather-akiruno': 'http://api.openweathermap.org/data/2.5/weather?q=Akiruno-shi' },
    { 'currency-yen-php': 'http://rate-exchange.appspot.com/currency?from=JPY&to=PHP'}
]

var mainKey = 'analytics-info'

function initializeKey() {
    client.get(query(mainKey, 'id'), function(err, getReply) {
        if(getReply == null) {
            client.set(query(mainKey, 'id'), '0', redis.print)
        }
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
                        });
                        break;
                }

            }
            if(i == fetchUrl.length -1 ) {
//                client.multi()
//                    .lpush(query(mainKey, 'id.list'), getReply)
//                    .incr(query(mainKey, 'id'))
//                    .exec(redis.print)
//                console.log(serverStart)
            }
        }
    })
}
getData();
setInterval(function() { getData()
}, loop_delay)


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
        response.on('data', function(chunk) {
            var data = JSON.parse(chunk)
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
    })
}

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}


function makePost(id, mainKey, dataKey) {
    var options = {
        hostname    : '127.0.0.1',
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