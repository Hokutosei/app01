var RedisCluster = require('redis-cluster').poorMansClusterClient;
var assert = require('assert');

var cluster = [
    {name: 'redis01', link: '10.0.1.2:6379', slots: [   0, 1363], options: {max_attempts: 5}},
    {name: 'redis02', link: '10.0.1.3:6379', slots: [1364, 2369], options: {max_attempts: 5}}
//    {name: 'redis03', link: '127.0.0.1:8379', slots: [2370, 4095], options: {max_attempts: 5}}
];

var redisClients = RedisCluster(cluster);




var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var redis = require('redis');
//    redisClients = redis.createredisClients(14396, 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com');
//    redisClients.auth('jinpol', function(err, res) {
//        if (err) {
//            console.log('auth error ' + err)
//        } else { console.log('authorized..') }
//    });

//    redisClients = redis.createredisClients(6379, '10.0.1.2', {no_ready_check: true});

app.get(/^(.+)$/, function(req, res) {
    res.sendfile('public/' + req.params[0]);
});

initializeUsers();

io.sockets.on('connection', function(socket) {
    socket.emit('helloServer', { message: 'hello socket'});
    socket.on('testing', function(data) {
        console.log(data)
    });

    //redisClients.flushdb(redis.print)
    socket.on('flushDb', function() {
        redisClients.flushdb(redis.print);
        initializeUsers()
    });

    redisClients.llen('users:id', function(err, reply) {
        if (err) { console.log('could not make llen of users:id..')}
        else { console.log('users:id ' + reply) }
    });

    socket.on('userRegistration', function(data) {
        var keysCount = countObjectKeys(data)
        redisClients.lrange(query('users', 'id'), 0, -1, function(err, usersId) {
            var keyFound = [];
            if (usersId.length != 0) {
                for(var i = 0, c = 1; i < usersId.length; i++) {
                    redisClients.hget([query('users', usersId[i]), 'name'], function(err, user) {
                        if (user == data['name']) { keyFound.push(1) }
                        if (c == usersId.length || usersId == null ) { evalUsers(keyFound) }
                        c++
                    })
                }
            } else { evalUsers(keyFound, 1) }
            function evalUsers(obj) {
                if (arrayHasValue(keyFound, 1)) {

                    redisClients.get(query('users'), function(err, userCount) {
                        createOrUpdateUser(data, userCount, keysCount);
                        // return user
                    })
                } else {
                    redisClients.get(query('users'), function(err, userCount) {
                        createOrUpdateUser(data, userCount, keysCount);

                        //return user
                        var updatingListsAndUsers = new Date();
                        redisClients.multi().lpush(query('users', 'id'), userCount)
                            .incr(query('users'), redis.print)
                            .lrange(query('users', 'id'), 0, -1, redis.print)
                            .exec(function(err, reply) {
                                console.log('Finish in ' + (new Date - updatingListsAndUsers) + ' ms')

                                // benchmark here, dump all data
                                redisClients.lrange(query('users', 'id'), 0, -1, function(err, usersId) {
                                    var start = new Date()
                                    for(var i =0; i < usersId.length; i++) {
                                        redisClients.hgetall(query('users', usersId[i]), function(err, user) {
                                            //console.log(user)
                                            if (i == usersId.length - 1) {
                                                console.log('Pushed all in ' + (new Date() - start) + ' ms')
                                            }

                                        })
                                    }
                                })
                            })
                    })
                }
            }
        });
    })
})

function initializeUsers() {
    redisClients.get(query('users'), function(err, reply) {
        if (reply == null) {
            redisClients.set(query('users'), '0', redis.print)
        }
        console.log(reply)
    });
}

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}

function objectLengthCount(obj) {
    return Object.keys(obj).length
}

function returnResult(obj) {
    var o = obj.toString()
    return o
}

function arrayHasValue(arr, val) {
    if (arr.length != 0) { for(var i = 0;i < arr.length; i++) { return !!(arr[i] == val) } }
}

function findUserById(data) {
    redisClients.lrange(query('users', 'id'), function(err, usersId) {
        for(var i = 0, c = 1; i < usersId.length; i++) {
            redisClients.hget([query('users', usersId[i]), 'name'], function(err, user) {
                if (user == data['name']) {
                    redisClients.hgetall(query('users', usersId[i]), function(err, thisUser) {
                        console.log(thisUser);
                    })
                }
                c++
            })
        }
    })
}

function countObjectKeys(arr) {
    var counter = 0;
    for(keys in arr) { if (arr[keys] != '') { counter++;} }
    return counter
}

/*
 BASIC CRUD METHODS

 */

function createOrUpdateUser(arr, userId, objectCount) {
    for(key in arr) {
        var aCounter = 0;
        if(arr[key] != '') {
            var start = new Date()
            redisClients.hset([query('users', userId), key, arr[key]], function(err, reply) {
                console.log('Reply ' + reply + ' : ' + (new Date() - start) + ' ms')
                console.log('my counter ' + aCounter)
                aCounter++;
                if(aCounter == objectCount) {
                    redisClients.hgetall(query('users', userId), function(err, thisUser) {
                        console.log(thisUser);
                        io.sockets.emit('myCurrentUser', {data: thisUser, id: userId})
                    })
                }
            })

        }
    }
}




var port = process.env.PORT || 4000;
server.listen(port, function() {
    console.log('Listening on ' + port)

})