var https = require('https');

var globalIp = '60.148.89.178' || '10.0.1.2';
var redis = require('redis');
var client = redis.createClient(6379, globalIp, {no_ready_check: true});
var counter = 0
var fb = 'facebook'

var async = require('async')
var jpUtils = require('./utils')


var cluster = require('cluster');
var cpuCount = require('os').cpus().length;

var mainRedisHost = require('./testing/redisdb.js').distribute()[0]
//var mainRedisClient = redis.createClient(mainRedisHost['ip'], mainRedisHost['address'])
var mainRedisClient = client

var log = function(str) {
    console.log(str)
}


// Code to run if we're in the master process
if (cluster.isMaster) {
    // Create a worker for each CPU
    for (var i = 0; i < 1; i += 1) {
        cluster.fork();
    }
    console.log('Master is working.. ' + cluster)
    mainRedisClient.get(query('facebook', 'token', 'id'), function(err, getReply) {
        var counter;
        if(getReply == null) {
            mainRedisClient.set(query('facebook', 'token', 'id'), 0, function(err, setReply) {
                counter = setReply
                //getAndSetAccessToken(counter)
            })
        } else { counter = getReply;
        //    getAndSetAccessToken(counter)
        }
    })
} else {
    console.log('Working ' + cluster.worker.id + ' Running!')
    initializeFeeds();

}

function facebook_feed() {
    var startTime = new Date();
    var id;
    async.series([
        function(callback) {
            mainRedisClient.get(query(fb, 'token', 'id'), function(err, getReply) {
                id = getReply
                callback(null, getReply)
            })
        },
        function(callback) {
            client.hgetall(query(fb, 'access_token', id - 1), function(err, hgetAllReply) {
                log(hgetAllReply['access_token'])
                https.get('https://graph.facebook.com/1638322655/home?access_token=' + hgetAllReply['access_token'], function(response) {
                    var data = '', finishTime = new Date() - startTime;
                    response.on('data', function(chunk){
                        data += chunk;
                    });
                    response.on('end', function(){
                        var dataArray = [];
                        var obj = JSON.parse(data), objectData = obj['data'];
                        var objectLength = Object.keys(obj['data']).length;
                        for(var i = 0; i < objectLength; i++) {
                            var fromUser = obj['data'][i].from.name;
                            var keyData = ['name', 'story', 'message', 'type', 'picture', 'link', 'status_type', 'created_time'];
                            obj['data'][i].from.name = {};
                            for(var d = 0; d < keyData.length; d++) {
                                if(keyData[d] == 'name') { objectData[i]['name'] = fromUser }
                                if(keyData[d] == 'message' && objectData[i]['message'] != undefined) { objectData[i]['message'].toString().replace('\\', '').replace('\n.', '') }
                                if(objectData[i][keyData[d]] != undefined) {
                                    obj['data'][i].from.name[keyData[d]] = objectData[i][keyData[d]]
                                }
                            }
                            dataArray.push(obj['data'][i].from.name)
                            if(i == objectLength - 1) {
                                //console.log(dataArray)
                                for(var a = 0; a < dataArray.length; a++) {
                                    console.log('***************************************************************');
                                    console.log(a)
                                    //console.log(dataArray.reverse()[a]);
                                    jpUtils.logJson(dataArray.reverse()[a])
                                }
                                counter++;
                                console.log(counter + '***************************************************************')
                                console.log('Took ' + finishTime + ' ms')
                                callback(null, 'done')
                            }
                        }
                    });

                });
            })
        }
    ], function(err, results) {
        initializeFeeds()
        log(results)
    })




}

function fetchAllData(objectData, i, obj) {
    for(key in objectData[i]) {
        obj['data'][i].from.name[key] = objectData[i][key]
    }
}

//initializeFeeds();
function initializeFeeds() {
    log('initialized')
    client.get('facebook:feed:interval', function(err, getReplyInterval) {
        var interval = getReplyInterval
        setTimeout(facebook_feed, interval)
    })
}


function longLiveMyToken(token, appId, clientSecret, callback) {
    var req = https.request({
        host: 'graph.facebook.com',
        path: '/oauth/access_token',
        method: 'POST'
    }, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            //console.log(chunk);
            callback(null, chunk)
        });
        res.on('end', function() {
            //console.log('status: '+res.status);
        });
    });
    req.end('grant_type=fb_exchange_token'
        +'&client_id='+encodeURIComponent(appId)
        +'&client_secret='+encodeURIComponent(clientSecret)
        +'&fb_exchange_token='+encodeURIComponent(token)
    );

};

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}

function getAndSetAccessToken(id) {
    var counter, extendedToken, credentials;
    async.series([
        function(callback) {
            mainRedisClient.get(query('facebook', 'token', 'id'), function(err, getReply) {
                counter = getReply
                callback(null, getReply)
            })
        },
        function(callback) {
            mainRedisClient.hgetall(query(fb, 'credentials'), function(err, hgetAllReply) {
                credentials = hgetAllReply
                longLiveMyToken(hgetAllReply['token'], hgetAllReply['appid'], hgetAllReply['secret'], function(err, res) {
                    var token = res.split('=')[1].replace('&expires', '')
                    extendedToken = token
                    callback(null, res.split('=')[1].replace('&expires', ''))
                })
            })
        },
        function(callback) {
            data = { access_token: extendedToken, time: new Date() }
            mainRedisClient.hmset(query(fb, 'access_token', counter), data, function(err, hmsetReply) {
                mainRedisClient.incr(query(fb, 'token', 'id'))
                callback(('hmset: ' + hmsetReply).toString())
            })
        }
    ], function(err, results) {
        console.log(results)
    })
}

function currentTokenId() {
    return mainRedisClient.get(query('facebook', 'token', 'id'), function(err, getReply) {
        var counter = getReply
        return counter
    })
}