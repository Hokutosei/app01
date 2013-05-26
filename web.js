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
        var dataObjects = [];

        var startExecution = new Date();
//        client.multi().get('users', function(err, usersCount) {
//            console.log('Current user count ' + usersCount);
//            client.lpush('users:id', usersCount);
//            for(key in data) {
//                client.lrange('users:id', 0, -1, function(err, users_id) {
//                    var searchTime = new Date()
//                    for(var i = 0; i < users_id.length; i++) {
//                        client.hget(['users:' + users_id[i], 'name'], function(err, userName) {
//                            if (userName == data['name']) {
//                                console.log('took ' + (new Date - searchTime) + ' ms');
//                            } else if (data[key] != '' && data['name'] != ''&& userName != data['name']) {
//                                console.log('not found')
//                                client.hset(['users:' + usersCount, key, data[key]], redis.print);
//                                client.hset(['users:' + usersCount, 'id', usersCount], redis.print)
//                                client.incrby('users', 1, function(err, userIncr) {
//                                    console.log('User is incr '+ userIncr)
//                                })
//
//                            }
////                            else if (data[key] != '' && data['name'] != '') {
////                                client.hset(['users:' + usersCount, key, data[key]], redis.print);
////                                client.hset(['users:' + usersCount, 'id', usersCount], redis.print)
////                                client.incrby('users', 1, redis.print)
////                            }
//
//                        })
//                    }
//                })
////                if (data[key] != '') {
////                    client.hset(['users:' + usersCount, key, data[key]], redis.print);
////                    client.hset(['users:' + usersCount, 'id', usersCount], redis.print)
////                }
//            }
////        }).incrby('users', 1).exec();
//        }).exec();


        client.get('users', function(err, userCount) {
            console.log(data['name'])
            client.lpush(queryConstruct('users', 'id'), userCount)
            client.lrange(queryConstruct('users', 'id'), 0, -1, redis.print)

            client.lrange('users:id', 0, -1, function(err, users_id) {
                for(var i = 0; i < users_id.length; i++) {
                    client.hget([queryConstruct('users', users_id[i]), 'name'], function(err, userName) {
                        console.log(userName)
                        if (userName != data['name']) {
                            var array = [], c = 0
                            for(key in data) {
                                if (key != '') {
                                    array.push(key + ' ' + data[key])
                                    c++
                                }
                                if (c == objectLengthCount(data)) {
                                    console.log(array.join(', '))
                                    client.hmset(queryConstruct('users', 'id'), array.join(', '), redis.print)
                                    return false
                                }
                            }
                            return false
                        }
                    })
                }
            });

        })

        client.multi().lrange('users:id', 0, -1, function(err, reply) {
                var seen = 0;
                for(var i = 1; i < reply.length; i++) {
                    client.hgetall('users:' + i, function(err, hgetallReply) {
                        dataObjects.push(hgetallReply);
                        seen++;
                        if (seen == reply.length -1) {
                            socket.emit('users_list', {data: dataObjects})
                        }
                    });
                }
            }).exec(function(err, reply) {
                var endTime = new Date() - startExecution + 'ms';
                if (err) { console.log('there is something wrong with your queries')}
                else { console.log('executed in ' + endTime)}
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
var port = process.env.PORT || 4000;
server.listen(port, function() {
    console.log('Listening on ' + port)

})