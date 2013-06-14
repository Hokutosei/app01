var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var globalIp = '126.15.226.61' || '10.0.1.2';
var redis = require('redis');
    client = redis.createClient(6379, globalIp, {no_ready_check: true, parser: 'hiredis'});

var express = require('express'),
    cookie = require('cookie'),
    connect = require('connect')

app.configure(function() {
    app.use(express.cookieParser());
    app.use(express.session({secret: 'session', key: 'express.sid'}));
})


app.get(/^(.+)$/, function(req, res) {
    res.sendfile('public/' + req.params[0]);
});


io.configure(function (){
    io.set('authorization', function (handshakeData, callback) {
        //console.log(handshakeData.headers.cookie)
        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie)
        callback(null, true); // error first callback style
    });
});

initializeUsers();

var users = 'users';
(function() {
    function pingRedis() {
        var start = new Date()
        client.lrange(query(users, 'id'), 0, -1, function(err, lrangeReply) {
            var resTime = (new Date() - start) + ' ms' ;
            console.log(resTime)
            io.sockets.emit('lrangeReply', { data: lrangeReply, response: resTime})
        })
        setTimeout(pingRedis, 10000)
    }

    function getInfo() {
        client.info(function(err, infoReply) {
            io.sockets.emit('inforReply', { data: parseInfo(infoReply) })
        })
        setTimeout(getInfo, 30000)
    }

    pingRedis()
    getInfo()
})();

(function() {
    function checkLoggedInUsers() {
        client.lrange(query(users, 'logged.in'), 0, -1, function(err, lrangeReply) {
            console.log(lrangeReply == '')
            if(lrangeReply != '') {
                for(var i = 0; i < lrangeReply.length; i++) {
                    client.hget(query(users, lrangeReply[i]), 'name', function(err, hgetReply) {
                        console.log(hgetReply)
                    })
                }
            }
        })
    }
    setTimeout(checkLoggedInUsers, 2000)
    checkLoggedInUsers();
})();


io.sockets.on('connection', function(socket) {
    //console.log(socket.handshake.address)
    console.log(socket.handshake.cookie['express.sid'])

    socket.emit('helloServer', { message: 'hello socket'});
    socket.on('testing', function(data) {
        console.log(data)
    });

    socket.on('disconnect', function() {
        io.sockets.emit('user_disconnected',{ message: socket.id})
    });


    //client.flushdb(redis.print)
    socket.on('flushDb', function() {
        client.flushdb(function(err, flushDbReply) {
            console.log(flushDbReply)
            initializeUsers()
        });
    });

    client.llen('users:id', function(err, reply) {
        if (err) { console.log('could not make llen of users:id..')}
        else { console.log('users:id ' + reply) }
    });

    socket.on('userRegistration', function(data) {
        var keysCount = countObjectKeys(data)

        client.lrange(query(users, 'id'), 0, -1, function(err, usersId) {
            if(usersId.length == 0) {
                client.multi().set(query(users), 0, redis.print)
                    .lpush(query(users, 'id'), 0, redis.print)
                    .exec(redis.print)
            }
        })
        client.lrange(query('users', 'id'), 0, -1, function(err, usersId) {
            var validationArray = [];
            for(var i = 0, counter = 0; i < usersId.length; i++) {
                client.hget(query('users', usersId[i]), 'name', function(err, usersIdReply) {

                    if(usersIdReply == data['name']) {
                        var msg = 'username is not available';
                        socket.emit('userNotAvailable', { data: 'user name is not available'});
                        console.log(msg)
                        validationArray.push(1)
                    } else if((counter == (usersId.length -1)) && arrayHasValue(validationArray, 1) != true) {
                        console.log('save this user');
                        client.get(query(users), function(err, usersReplyToId) {
                            console.log(usersReplyToId)
                            var dataCounter = 0, startTime = new Date();
                            data['id'] = usersReplyToId, data['socketId'] = socket.id;
                            for(keys in data) {
                                if(data[keys] != '') {
                                    client.hset(query(users, usersReplyToId), keys, data[keys], function(err, hsetReply) {
                                        dataCounter++;
                                        if(countObjectKeys(data) == dataCounter) {
                                            console.log('hset took ' + (new Date() - startTime) + ' ms');

                                            //after setting a user, return it to the logged in user
                                            // make some validation here buy getting the registered user socket
                                            client.hgetall(query(users, usersReplyToId), function(err, hgetallReply) {
                                                //client.lpush(query(users, 'logged.in'), usersReplyToId)
                                                socket.emit('thisUserData', { data: hgetallReply})
                                            })
                                            client.multi().lpush(query(users, 'id'), usersReplyToId)
                                                .incr(query(users))
                                                .exec(redis.print)


                                            // making credentials for the user
                                            //
                                            client.lrange(query(users, 'id'), 0, -1, function(err, lrangeReply_log) {
                                                for(var i = 0; i < lrangeReply_log.length; i++) {
                                                    client.get(query(users, lrangeReply_log[i], 'session.id'), function(err, getReply) {
                                                        console.log(getReply)
                                                    })
                                                }
                                            })
                                            client.multi()
                                                .set(query(users, usersReplyToId, 'session.id'), socket.handshake.cookie['express.sid'], redis.print)
                                                .lpush(query(users, 'logged.in'), usersReplyToId, redis.print)
                                                .get(query(users, usersReplyToId, 'session.id'), function(err, getReply) {
                                                    client.hget(query(users, usersReplyToId), 'name', function(err, hgetReply) {
                                                        io.sockets.socket(socket.id).emit('userLoggedIn', { name: hgetReply, sessionId: getReply })
                                                    })
                                            }).exec(redis.print)

                                        }
                                    });
                                }
                            }

                        })
                    }
                    counter++;
                })
            }
        });
    })
})

function initializeUsers() {
    client.get(query('users'), function(err, reply) {
        if (reply == null) {
//            client.set(query('users'), '0', function(err, setReply) {
//                console.log('this set reply ' + setReply)
//                client.get(query('users'), function(err, userReply) {
//                    client.lpush(query('users', 'id'), userReply, function(err, lpushReply) {
//                        console.log(lpushReply)
//                    })
//                })
//            })
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
    client.lrange(query('users', 'id'), function(err, usersId) {
        for(var i = 0, c = 1; i < usersId.length; i++) {
            client.hget([query('users', usersId[i]), 'name'], function(err, user) {
                if (user == data['name']) {
                    client.hgetall(query('users', usersId[i]), function(err, thisUser) {
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


/*
    BASIC CRUD METHODS

 */

function createOrUpdateUser(arr, userId, objectCount) {
    console.log('this object count' + objectCount);
    for(key in arr) {
        var aCounter = 0;
        if(arr[key] != '') {
            var start = new Date();
            client.hset([query('users', userId), key, arr[key]], function(err, reply) {
                console.log('Reply ' + reply + ' : ' + (new Date() - start) + ' ms')
                console.log('my counter ' + aCounter)
                aCounter++;
                if(aCounter == objectCount) {
                    client.hgetall(query('users', userId), function(err, thisUser) {
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
    console.log('Listening on ' + port + ' and redis port to ' + globalIp)

});


