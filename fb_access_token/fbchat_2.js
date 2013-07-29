var FacebookChat = require("facebook-chat");
var myUtils = require('.././utils')
var redisHost = require('.././testing/redisdb').distribute()[0]
    , redisDistributed = require('.././testing/redisdb').distribute()
var async = require('async')
    log = function(str) { myUtils.log(str) }
    logJson = function(str) { myUtils.logJson(str) }

var params = {
    facebookId : '1638322655',
    appId : '316661848467900',
    secret_key : '1ac6a50ef0d6c6f6ba14b2079f2e3672',
    accessToken : 'CAAEgAJT96bwBANmBzkmIB1FcE40GLfStmMge8OZApZB5B4Sv8vMwkTZBh3AUwBu4hXgOJYnvwE69I5ZAUvGudPod8rhiBHMRdOdT0r7AxPrOLp0VkrHayJattkIZCJh9njsmTBye6ZAdxB4I5OcEufJPO3X5L6jCEZD'
};

var facebookClient = new FacebookChat(params, function(err, result) {
    myUtils.log('done')
});
facebookClient.on('online', function(){
    //Get friend list
    facebookClient.roster();

});

var userListId = ['1673556533', '100003767773164', '1638322655']
    , userNameList = []
    , jeanepaulId = '1638322655';


(function() {
        var list = [], data = {}
        async.series([
            function(callback) {
                userListId.forEach(function(element) {
                    redisHost.hgetall(myUtils.query('facebook', 'chat', 'user', element), function(err, hgetReply) {
                        list.push(hgetReply)
                        callback()
                    })
                })
            }
        ], function(err, result) {
            userNameList = list
        })
    }
)();



var msg = []
var promptStr = 'jeanepaulFb> '

var readline = require('readline'),
    rl = readline.createInterface({input: process.stdin, output: process.stdout, terminal: false});

rl.setPrompt(promptStr);
rl.prompt();

var sessionSelectedUserId = ''

rl.on('line', function(line) {
    switch(line.trim()) {
        case 'select':
            userNameList.forEach(function(element, index) {
                log(myUtils.displayQuery(index, element['name']))
            })
            rl.question('user?', function(answer) {
                sessionSelectedUserId = userNameList[parseInt(answer)]['id']
                log(sessionSelectedUserId)

                rl.close
            })
            break;
        case 'friends':
            getFriendsList()
            break;
        default:
            myUtils.log(promptStr + line.trim())
            facebookClient.send('-'+ sessionSelectedUserId +'@chat.facebook.com', line.trim());
            saveMessageToDb(jeanepaulId, sessionSelectedUserId, line.trim(), function(err, result, time) {
                log(result)
            })
            break;
    }
})
facebookClient.on('message', function(message){
    var fbUserId = message['from'].replace('@chat.facebook.com', '').replace('-', '')
    var from, to;
    async.series({
        from: function(callback) {
            getUserData(fbUserId, function(err, result) {
                callback(null, result['name'])
            })
        },
        to: function(callback) {
            getUserData(jeanepaulId, function(err, result) {
                callback(null, result['name'])
            })
        }
    }, function(err, result) {
//        logJson(result)
    })

    redisHost.hget(myUtils.query('facebook', 'chat', 'user', fbUserId), 'name', function(err, hgetReply) {
        myUtils.log(hgetReply + '> ' + message['body'])
    })

});

function getUserData(id, callback) {
    redisHost.hgetall(myUtils.query('facebook', 'chat', 'user', id), function(err, hgetReply) {
        return callback(null, hgetReply)
    })
}

function getFriendsList() {
    facebookClient.roster()

    facebookClient.on('roster', function(roster){
        log(roster)
        roster.forEach(function(item, index) {
            logJson(extractFbId(item['id']))
            log(myUtils.displayQuery(index, item['name']))
        })
    });
}

function lineUserDataDisplay(from, to, msg, counter) {

}

function extractFbId(str) {
    return str.replace('@chat.facebook.com', '').replace('-', '')
}

function saveMessageToDb(from, to, message, saveCallback) {
    var counter, startTime = new Date;
    async.series([
        function(callback) {
            redisHost.get(myUtils.query('facebook', 'message', 'counter'), function(err, getReply) {
                counter = parseInt(getReply)
                callback(null, getReply)
            })
        },
        function(callback) {
            var saveTime = new Date(), savedCounter = 0
            redisDistributed.forEach(function(host) {
                var msgData = { from: from, to: to, message: message, time: new Date() }
                host.hmset(myUtils.query('facebook', 'message', counter), msgData, function(err, hmsetReply) {
                })
                savedCounter++;
            })
            callback(null, 'savedHost: ' + savedCounter, 'Took: ' + (new Date() - saveTime) + ' ms')
        },
        function(callback) {
            redisHost.incr(myUtils.query('facebook', 'message', 'counter'), function(err, incResult) {
                callback(null, 'message:counter: ' + incResult)
            })
        }
    ], function(err, result) {
        saveCallback(null, result, counter, 'Transactions took: ' + (new Date() - startTime) + ' ms')
    })
}

//1638322655

//key
// messageFromUser:id
// messageToUser:id