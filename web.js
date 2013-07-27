var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs');


var globalIp = '126.15.225.128' || '10.0.1.2';
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
    app.use('/public', __dirname + '/public');
    app.use(express.static(__dirname + '/public'));
    app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'session', key: 'express.sid'}));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
})

//app.get(/^(.+)$/, function(req, res) {
//    console.log('===========================')
//    console.log(req.user)
////    res.send('test')
////    res.sendfile('public/' + req.params[0]);
//    res.send('testing')
//    res.end
//});

//app.get('/', function(req, res) {
//    console.log('===========================')
//    res.send('testing')
//    res.end
//});
//
//
app.get('/index', ensureAuthenticated, function(req, res){
    console.log('========================================')
    console.log(req.user)
//    var id = io.sockets.socket.id
//    io.sockets.emit('current_user', { data: req.user });

    console.log('========')
    res.render('index');
    res.write(JSON.stringify(data))
});


io.configure(function (){
    io.set('authorization', function (handshakeData, callback) {
        callback(null, true); // error first callback style
    });
});

function findById(id, fn) {
    client.lrange(query(users, 'id'), 0, -1, function(err, lrangeReply) {
        if (lrangeReply.indexOf(id) > -1) { fn(null, id) }
        else { fn(new Error('User ' + id + ' does not exist')) }
    })
}

function findByUsername(username, fn) {
    client.hgetall(query('users', username), function(err, hgetAllReply) {
        if(hgetAllReply != null && hgetAllReply['username'] === username) {
            return fn(null, hgetAllReply)
        } else {
            return fn(null, null)
        }
    })
}



passport.serializeUser(function(user, done) {
    console.log('serializing')
    console.log(user)
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
            var startTime = new Date()
            findByUsername(username, function(err, user) {
                console.log('============')
                console.log(user)
                if (user === null) {
                    console.log('is not user');
                    return done(null, false, { message: 'Unknown user ' + username });
                }
                if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            })
        });
    }
));

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (user === null) {
//            return res.redirect('/login')
            res.write('failed')
            res.end()
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            console.log('+============')
            var data = {user: req.user}
            res.write(JSON.stringify(data));
            res.end()
        });
    })(req, res, next);
});



function ensureAuthenticated(req, res, next) {
    console.log('ensuring')
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
        //console.log(handshakeData.cookie)
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

    console.log('===============')
    socket.emit('testingEmit', {data: 'awaaaaaa'})
    console.log(socket.id)
    socket.handshake.id = socket.id

    //client.flushdb(redis.print)
    socket.on('flushDb', function() {
        client.flushdb(function(err, flushDbReply) {
            console.log(flushDbReply)
            initializeUsers()
        });
    });

    socket.on('userRegistrationNew', function(data) {
        console.log(data)
        data['created_at'] = new Date();

        client.get(query(users), function(err, getReply) {
            data['id'] = getReply
            console.log(getReply)
            client.multi().hmset(query(users, data['username']), data, function(err, hmsetReply) {
                console.log(hmsetReply)
            })
                .lpush(query(users, 'id'), getReply, redis.print)
                .incr(query(users), redis.print)
                .exec(function(err, execReply) {
                    console.log(execReply)
                });

        })
    });
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


var templateEngine = function (template, data) {
    var vars = template.match(/\{\w+\}/g);

    if (!vars) {
        return template;
    }

    var nonVars = template.split(/\{\w+\}/g);
    var output = '';

    for (var i = 0; i < nonVars.length; i++) {
        output += nonVars[i];

        if (i < vars.length) {
            var key = vars[i].replace(/[\{\}]/g, '');
            output += data[key]
        }
    }

    return output;
};


var port = process.env.PORT || 4000;
server.listen(port, function() {
    console.log('Listening on ' + port + ' and redis port to ' + globalIp)

});


