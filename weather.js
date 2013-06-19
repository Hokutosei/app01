var http = require('http'),
    redis = require('redis');

var loop_delay = 100000, counter = 0;

var globalIp = '60.148.89.178' || '10.0.1.2';
var redis = require('redis');
client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
    if(err) { console.log('could not connect to redis server') }
});


var fetchUrl = [
    { 'weather-akiruno': 'http://api.openweathermap.org/data/2.5/weather?q=Akiruno-shi' },
    { 'currency-yen-php': 'http://rate-exchange.appspot.com/currency?from=JPY&to=PHP'}
]

var key = 'analytics-info'

function initializeKey() {
    client.get(query(key, 'id'), function(err, getReply) {
        if(getReply == null) {
            client.set(query(key, 'id'), '0', redis.print)
        }
    })
}
initializeKey()
function getData() {
    for(var i = 0; i < fetchUrl.length; i++) {
        for(key in fetchUrl[i]) {
            switch (key.toString()) {
                case 'weather-akiruno':
                    console.log('weather');
                    getRequest(fetchUrl[i]['weather-akiruno'], 'weather-akiruno');
                    break;
                case 'currency-yen-php':
                    console.log('currency');
                    getRequest(fetchUrl[i]['currency-yen-php'], 'currency-yen-php');
                    break;
            }
        }
        if(i == fetchUrl.length -1 ) {
             client.incr(query(key, 'id'), redis.print)
        }
    }
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

function getRequest(url, key) {
    http.get(url, function(response) {
        response.on('data', function(chunk) {
            var data = JSON.parse(chunk)
            console.log('====================== ' + key)
            console.log(data)
        })
    })

}

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}
