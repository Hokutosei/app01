var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var globalIp = '60.148.89.178' || '10.0.1.2';
var redis = require('redis');
    client = redis.createClient(6379, globalIp, {no_ready_check: true}, function(err, reply) {
        if(err) { console.log('could not connect to redis server') }
    });

var express = require('express'),
    cookie = require('cookie'),
    connect = require('connect'),
    passport = require('passport'),
    util = require('util'),
    LocalStrategy = require('passport-local').Strategy;


app.configure(function() {
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'session', key: 'express.sid'}));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
//    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
})

app.get(/^(.+)$/, function(req, res) {
    res.sendfile('public/' + req.params[0]);
});

app.get('/', function(req, res){
    res.render('index', { user: req.user });
});

//app.get('/account', ensureAuthenticated, function(req, res){
//    res.render('account', { user: req.user });
//});
//
//app.get('/login', function(req, res){
//    res.render('login', { user: req.user, message: req.flash('error') });
//});
//
//
//
//app.get('/logout', function(req, res){
//    req.logout();
//    res.redirect('/');
//});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.


var users = [
        { id: 1, username: 'jeanepaul', password: 'jinpol' }
    ,   { id: 2, username: 'dina', password: 'dindin' }
    ,   { id: 3, username: 'daena', password: 'daenapauline' }
]

var users2 = [
    { username: 'jeanepaul', password: 'jinpol'}, { username: 'dina', password: 'dina12'}

]

function findById(id, fn) {
    var idx = id -1;
    if(users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    client.lrange(query('users', 'id'), 0, -1, function(err, lrangeReply) {
        for(var i = 0; i < lrangeReply.length; i++) {
            client.hget(query('users', lrangeReply[i]), 'username', function(err, hgetReply) {
//                console.log(hgetReply)
                //console.log(username)
//                console.log('===========')
//                console.log(hgetReply === username)
                if(hgetReply === username) {
                console.log('===========')
                    console.log(username)
                }


//                if(hgetReply === username) {
//                    console.log(lrangeReply[i])
//                    console.log('found!!!!')
//                    client.hgetall(query('users', lrangeReply[i]), function(err, hgetallReply) {
//                        console.log(hgetallReply)
//                        //return fn(null, hgetallReply)
//                    })
//                }
//                else {
//                    return fn(null, null)
//                }
            })
        }
    });

//    for(var i = 0; i < users2.length; i++) {
//        if(users2[i].username === username) {
//            return fn(null, users2[i])
//        }
//    }
}



passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function(err, user) {
        done(err, user)
    })
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            // Find the user by username.  If there is no user with the given
            // username, or the password is not correct, set the user to `false` to
            // indicate failure and set a flash message.  Otherwise, return the
            // authenticated `user`.
            findByUsername(username, function(err, user) {
                console.log(user)
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
                if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            })
        });
    }
));
//app.get('/login', function(req, res){
//    console.log('login?')
//    res.render('login', { user: req.user, message: req.flash('error') });
//});

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            //req.flash('error', info.message);
            return res.redirect('/login')
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/' );
        });
    })(req, res, next);
});



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/')
}
app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});





io.configure(function (){
    io.set('authorization', function (handshakeData, callback) {
        //console.log(handshakeData.headers.cookie)
        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie)
        console.log(handshakeData.cookie)
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
                client.hget(query('users', usersId[i]), 'username', function(err, usersIdReply) {

                    if(usersIdReply == data['username']) {
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
                                                    client.hget(query(users, usersReplyToId), 'username', function(err, hgetReply) {
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


    // remove or modify this?
    socket.on('login', function(data) {
        console.log('loggedin?')
        app.post('/', passport.authenticate('local', {failureRedirect: '/', failureFlash: true}), function(req, res) {
            console.log('tried!')
            res.redirect('/')
        })

    })


});




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


