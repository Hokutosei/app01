var https = require('https')
    , hosts = require('./testing/redisdb')
    , myUtils = require('./utils')
    , async = require('async')
    , cluster = require('cluster')
    , cpuCount = require('os').cpus().length
    , redis = require('redis')
    , log = function(str) { myUtils.log(str) }
    , query = function() { myUtils.query() }
    , fb = 'facebook'
    , prettyJson = require('prettyjson')

var strLimit = 40, feedCounter = 0

var client = redis.createClient(6379, '10.0.1.29');

if (cluster.isMaster) {
    // Create a worker for each CPU
    for (var i = 0; i < 1; i += 1) {
        cluster.fork();
    }
    console.log('Master is working.. ' + cluster)
} else {
    console.log('Working slave' + cluster.worker.id + ' Running!')
    facebookFeed()
}


function facebookFeed() {
    var id, access_token;
    async.series({
        one: function(callback) {
            var startTime = new Date();
            client.get(myUtils.query(fb, 'token', 'id'), function(err, getReply) {
                id = getReply
                callback(null, 'queryToken: ' + (new Date() - startTime) + 'ms')
            })
        },
        two: function(callback) {
            var startTime = new Date();
            client.hgetall(myUtils.query(fb, 'access_token', id -1), function(err, hgetAllReply) {
                access_token = hgetAllReply['access_token']
                callback(null, 'queryAccessToken: ' + (new Date() - startTime) + 'ms')
            })
        },
        three: function(callback) {
            var startTime = new Date();
            https.get('https://graph.facebook.com/1638322655/home?access_token=' + access_token, function(response) {
                var data = ''
                response.on('data', function(chunk){
                    data += chunk;
                });
                response.on('end', function() {
                    var dataArray = [],
                        parsedObj= JSON.parse(data),
                        dataObject = parsedObj['data'],
                        objectLength = Object.keys(dataObject).length

                        for(var i = 0; i < objectLength; i++) {
                            var currentData = dataObject.reverse()[i]
                            fbParser(currentData, currentData['type'], function(err, result) {
//                                log(result)
                            })
                        }
                    callback(null, 'fb_feed: ' + (new Date() - startTime) + 'ms')
                })
            })
        }
    }, function(err, result) {
        log('==============================' + feedCounter);
        logJson(result);
        initializeFeed();
        return false
    });

}

function initializeFeed() {
    feedCounter++;
    client.get('facebook:feed:interval', function(err, getReplyInterval) {
        var interval = getReplyInterval
        log('Setting interval.. ' + interval)
        setTimeout(facebookFeed, interval)
    })
}


function fbParser(object, type, callback) {
    var fbType = {
       'photo': function(object) {
            fbShowMessage(object, type)
        },
        'video': function(object) {
            var message;
            if(object['message'] != undefined) {
                message = object['message']
            } else if(object['description'] != undefined) {
                message = object['description']
            } else if(object['story']) {
                message = object['story']
            }
//
//            var objectMessage = object['message'] != undefined ? object['message'] : object['description']
//            var message = objectMessage.toString().substring(0,strLimit)

            var data = { name: object['from']['name'] + ' : ' + type, message: stringLimit(message)}
            logJson(data)
        },
        'swf': function(object) {
            var objectMessage = object['description'] != undefined ? object['description'] : object['name']
            var message = objectMessage.toString().substring(0,strLimit)

            var data = { name: object['from']['name'] + ' : ' + type, message: message}
            logJson(data)
        },
        'link': function(object) {
            var message;
            if(object['message'] != undefined) {
                message = object['message']
            } else if(object['description'] != undefined) {
                message = object['description']
            } else if(object['story']) {
                message = object['story']
            }

            var data = { name: object['from']['name'] + ' : ' + type, story: stringLimit(message) }
            logJson(data)
        },
        'status': function(object) {
            fbShowMessage(object, type)
        },
        'checkin': function(object) {
            var data = { name: object['from']['name'] + ' : ' + type }
            logJson(data)
        }
    };
    callback(null, fbType[type](object))
}

function fbShowMessage(object, type) {
    var data = { name: object['from']['name'] + ' : ' + type }
    if(object['message'] != undefined) {
        data['dataMessage'] = object['message'].toString().substring(0,strLimit).replace('\\', '').replace(/\s+/g," ")
    }
    logJson(data)
}

function logJson(jsonData) {
    console.log(prettyJson.render(jsonData, {
        keysColor: 'blue'
    }))
}

function stringLimit(str) {
    if(str == undefined) {
        return 'str is nil'
    } else { return str.substring(0,strLimit) }

}