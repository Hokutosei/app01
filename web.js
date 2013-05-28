var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var redis = require('redis'),
    client = redis.createClient(14396, 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com');
    client.auth('jinpol', function(err, res) {
        if (err) {
            console.log('auth error ' + err)
        } else { console.log('authorized..') }
    });

//    client = redis.createClient()

app.get(/^(.+)$/, function(req, res) {
    res.sendfile('public/' + req.params[0]);
});

initializeUsers();

io.sockets.on('connection', function(socket) {
    socket.emit('helloServer', { message: 'hello socket'});
    socket.on('testing', function(data) {
        console.log(data)
    });

    //client.flushdb(redis.print)
    socket.on('flushDb', function() {
        client.flushdb(redis.print);
        initializeUsers()
    });

    client.llen('users:id', function(err, reply) {
        if (err) { console.log('could not make llen of users:id..')}
        else { console.log('users:id ' + reply) }
    });

    socket.on('userRegistration', function(data) {
        client.lrange(query('users', 'id'), 0, -1, function(err, usersId) {
             var keyFound = [];
            if (usersId.length != 0) {
                for(var i = 0, c = 1; i < usersId.length; i++) {
                    client.hget([query('users', usersId[i]), 'name'], function(err, user) {
                        if (user == data['name']) { keyFound.push(1) }
                        if (c == usersId.length || usersId == null ) { evalUsers(keyFound) }
                        c++
                    })
                }
            } else { evalUsers(keyFound, 1) }
            function evalUsers(obj) {
                if (arrayHasValue(keyFound, 1)) {
                    client.get(query('users'), function(err, userCount) {
                        createOrUpdateUser(data, userCount);
                        // return user
                    })
                } else {
                    client.get(query('users'), function(err, userCount) {
                        createOrUpdateUser(data, userCount);
                        //return user
                        var updatingListsAndUsers = new Date();
                        client.multi().lpush(query('users', 'id'), userCount)
                            .incr(query('users'), redis.print)
                            .lrange(query('users', 'id'), 0, -1, redis.print)
                            .exec(function(err, reply) {
                                console.log('Finish in ' + (new Date - updatingListsAndUsers) + ' ms')

                                // benchmark here, dump all data
                                client.lrange(query('users', 'id'), 0, -1, function(err, usersId) {
                                    var start = new Date()
                                    for(var i =0; i < usersId.length; i++) {
                                        client.hgetall(query('users', usersId[i]), function(err, user) {
                                            console.log(user)
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
    client.get(query('users'), function(err, reply) {
        if (reply == null) {
            client.set(query('users'), '0', redis.print)
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


/*
    BASIC CRUD METHODS

 */

function createOrUpdateUser(arr, userCount) {
    for(key in arr) {
        if(arr[key] != '') {
            var start = new Date()
            client.hset([query('users', userCount), key, arr[key]], function(err, reply) {
                console.log('Reply ' + reply + ' : ' + (new Date() - start) + ' ms')
            })
        }
    }
}


var port = process.env.PORT || 4000;
server.listen(port, function() {
    console.log('Listening on ' + port)

})