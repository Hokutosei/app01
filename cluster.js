var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var redis = require('redis');
//    client = redis.createClient(14396, 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com');
//    client.auth('jinpol', function(err, res) {
//        if (err) {
//            console.log('auth error ' + err)
//        } else { console.log('authorized..') }
//    });

client = redis.createClient(6379, '10.0.1.2', {no_ready_check: true});


var clients = function() {
    var hosts = ['10.0.1.2', '10.0.1.3'], cluster =[];
    for(var i = 0; i < hosts.length; i++) {
        cluster[i] = redis.createClient(6379, hosts[i], {no_ready_check: true})
    }
    return cluster
}

//console.log(clients())
//console.log(clients())

//clients().get('users', redis.print)

var clusterRedis = function() {
    return function() {
        for(keys in clients()) {
            return clients()[keys]
        }
    }
}

for(keys in clients()) {
    clients()[keys].get('users', redis.print)
}

//clusterRedis().get('users', redis.print)