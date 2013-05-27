var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var redis = require('redis'),
//    client = redis.createClient(14396, 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com');
//    client.auth('jinpol', function(err, res) {
//        if (err) {
//            console.log('auth error ' + err)
//        } else { console.log('authorized..') }
//    });

    client = redis.createClient()

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
        client.lrange(queryConstruct('users', 'id'), 0, -1, function(err, usersId) {
            for(var i = 0, c = 1, keyFound = []; i < usersId.length; i++) {
                client.hget([queryConstruct('users', usersId[i]), 'name'], function(err, user) {
                    if (user == data['name']) { keyFound.push(1) }
                    if (c == usersId.length ) { evalUsers(keyFound) }
                    c++
                })
            }
            function evalUsers(obj) {
                console.log(arrayHasValue(obj, 1))
                if (arrayHasValue(keyFound, 1)) {
                    client.get('users', function(err, userCount) {
                        createOrUpdateUser(data, userCount)
                        // return user
                    })
                } else {
                    client.get(queryConstruct('users'), function(err, userCount) {
                        createOrUpdateUser(data, userCount)
                        //return user
                        client.lpush(queryConstruct('users', 'id'), userCount)
                        client.incr(queryConstruct('users'))
                        client.lrange(queryConstruct('users', 'id'), 0, -1, redis.print)
                    })
                }
            }
        });
    })

})

function initializeUsers() {
    client.get(queryConstruct('users'), function(err, reply) {
        if (reply == null) {
            client.set(queryConstruct('users'), '0', redis.print)
        }
        console.log(reply)
    });
}

function queryConstruct() {
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
            client.hset([queryConstruct('users', userCount), key, arr[key]], redis.print)
        }
    }
}


var port = process.env.PORT || 4000;
server.listen(port, function() {
    console.log('Listening on ' + port)

})