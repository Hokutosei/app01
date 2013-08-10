var http = require('http'),
    redis = require('redis'),
    queryString = require('querystring'),
    async = require('async'),
    prettyjson = require('prettyjson'),
    mainKey = 'data-analytics',
    FB = require('fb');

    FB.setAccessToken('CAAEgAJT96bwBANmBzkmIB1FcE40GLfStmMge8OZApZB5B4Sv8vMwkTZBh3AUwBu4hXgOJYnvwE69I5ZAUvGudPod8rhiBHMRdOdT0r7AxPrOLp0VkrHayJattkIZCJh9njsmTBye6ZAdxB4I5OcEufJPO3X5L6jCEZD')


var loop_delay = 720000, counter = 0, serverStart = new Date();

//var globalIp = '126.15.98.70' || '10.0.1.2';
var globalIp = '10.0.1.27'
var redis = require('redis');
var client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
    if(err) { console.log('could not connect to redis server') }
});



var hosts = require('./testing/redisdb.js').distribute()
console.log(hosts.length)


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

log(client['host'])


function main() {
    initializeKey()

    var fetchUrl = [
        { 'weather-akiruno': 'http://api.openweathermap.org/data/2.5/weather?q=Akiruno-shi' },
        { 'currency-yen-php': 'http://rate-exchange.appspot.com/currency?from=JPY&to=PHP'},
        { 'weather-paranaque' : 'http://api.openweathermap.org/data/2.5/weather?q=Paranaque'},
        { 'weather-omiya' : 'http://api.openweathermap.org/data/2.5/weather?q=Omiya'}
    ]

    function initializeKey() {
        client.get(query(mainKey, 'id'), function(err, getReply) {
            log(getReply)
            if(getReply == null) {
                client.set(query(mainKey, 'id'), '0', redis.print)
            }
            getData2()
        })
    }

    function initializer() {
        client.get(query('weather', 'interval', 'time'), function(err, intervalTime) {
            var processor = cluster.isMaster == true ? 'Master process' : cluster.worker.id
            console.log('Triggering getdata() in... ' + intervalTime + ' from cluster worker id ' + cluster.worker.id + ' / ' + cpuCount)
            setTimeout(getData2, intervalTime)
        })
    }


    function getData2() {
        var keyId, dataArr = [];
        var timeResults = [];
        var totalTime = {};
        var weatherData = {}
            , pesoCurrency = {}
            , mainDataForSave = []

        async.series([
            function(callback) {
                var startTime = new Date()
                client.get(query(mainKey, 'id'), function(err, getReply) {
                    keyId =  getReply
                    callback(null, keyId)
                    totalTimeResults((new Date() - startTime) + ' ms', query(mainKey, 'id'))
                })
            },
            function(callback) {
                async.forEachSeries(Object.keys(fetchUrl), function(item, upCallback) {
                    async.forEachSeries(Object.keys(fetchUrl[item]), function(keyItem, keyCallback) {
                        fetchUrlAndConstruct(Object.keys(fetchUrl[item])[0], fetchUrl[item][keyItem], constructData)
                    })
                    upCallback()
                })
                callback(null, timeResults)
            }
        ], function(err, results) {
            log(results)
        });
        initializer()

        function fetchUrlAndConstruct(keyStr, url, callbackFn) {
            var key = keyStr.substring(0, keyStr.indexOf('-'));
            callbackFn(key, keyStr, url)
        }
        function constructData(keystr, keyItem, url) {
            var urlConstructor = {
                'weather' : function(url) {
                    getRequest(url, keyItem, function(data, startTime) {
                        weatherData[keyItem] = {
                            'keyItem'               : keyItem,
                            'main-temp'             : (data['main'].temp - 273.15).toFixed(2),
                            'main-temp_min'         : (data['main'].temp_min - 273.15).toFixed(2),
                            'main-temp_max'         : (data['main'].temp_max - 273.15).toFixed(2),
                            'weather-main'          :  data['weather'][0].main,
                            'weather-description'   :  data['weather'][0].description,
                            'time'                  :  (new Date()).toString()
                        }
                        mainDataForSave.push(weatherData[keyItem])
                        totalTimeResults((new Date() - startTime) + ' ms', keyItem)

                    })
                },
                'currency' : function(url) {
                    getRequest(url, keyItem, function(data, startTime) {
                        pesoCurrency[keyItem] = {
                            'keyItem'               : keyItem,
                            'currency'  :   data['rate'],
                            'from'      :   data['from'],
                            'to'        :   data['to'],
                            'time'      :   (new Date()).toString()
                        }
                        mainDataForSave.push(pesoCurrency[keyItem])
                        totalTimeResults((new Date() - startTime) + ' ms', keyItem)
                    })
                }
            };
            urlConstructor[keystr](url);
        }

        function totalTimeResults(data, key) {
            totalTime[key] = data;
            if(Object.keys(totalTime).length == fetchUrl.length + 1) {
                logJson(totalTime)
                logJson(mainDataForSave)
                async.series([
                    function(callback) {
                        var startTime = new Date();
                        for(var i = 0; i < mainDataForSave.length; i++) {
                            setDataToDistributedRedis(mainDataForSave[i], keyId, mainDataForSave[i]['keyItem'])
                        }
                        callback(null, 'hmsets: ' + (new Date() - startTime + ' ms'))
                    },
                    function(callback) {
                        var getStartTime = new Date();
                        client.incr(query(mainKey, 'id'), function(err, getReply) {
                            callback(null, 'get: ' + (new Date() - getStartTime + ' ms: ') + 'current_id: ' + getReply)
                        })
                    },
                    function(callback) {
                        //postToFacebook()
                        callback(null, 'done fb')
                    }
                ], function(err, results) {
                    log(results)
                })
            }
        }


        function setDataToDistributedRedis(data, id, key) {
            if(key == 'weather-akiruno') {
                log('akiruno')
            }
            hosts.forEach(function(host) {
                var hmsetStart = new Date()
                host.hmset(query(mainKey, id, key), data, function(err, hmsetReply) {
                    // should display or not
                    //log(hmsetReply)
                })
            })
        }
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

    function getRequest(url, key, fn) {
        var dataArray = {}
        var startTime = new Date()
        http.get(url, function(response) {
            if(response.statusCode == 200) {
                // fix here
                response.on('data', function(chunk) {
                    if(IsJsonString(chunk)) {
                        var data = JSON.parse(chunk)
//                        console.log('====================== ' + key)
                        var counter = 1;
                        for(keys in data) {
                            dataArray[keys] = data[keys.toString()]
                            counter++;
                            if(counter == Object.keys(data).length) {
                                return fn(dataArray, startTime)
                            }
                        }
                    } else { return null }
                })
            } else {
                console.log('Error: ' + key + ' has: ' + response.statusCode + (new Date()).toString().replace('GMT+0900 (JST)', ''))
            }
        })
        .on('error', function(e) {
            console.log('Got error: ' + e.message)
        }).end()
    }

//    for(var i = 0; i < hosts.length; i++) {
////        hosts[i].set(query('testing', 'jeanepaul'), 100, redis.print)
//        hosts[i].get(query(mainKey, 'id'), redis.print)
//    }


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

function log(str) {
    console.log(str)
}

function logJson(data) {
    log('============================')
    log(new Date())
    log(prettyjson.render(data, {
        keysColor: 'blue'
    }))
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function postToFacebook() {
    var body = 'testing app';
    FB.api('me/feed', 'post', { message: body}, function (res) {
        if(!res || res.error) {
            console.log(!res ? 'error occurred' : res.error);
            return;
        }
        console.log('Post Id: ' + res.id);
    });
}