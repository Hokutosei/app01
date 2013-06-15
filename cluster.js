var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


var redis = require('redis');
var arrayClients = {};

var clients = function() {
    var hosts = ['10.0.1.2', '10.0.1.3'], cluster =[];
    for(var i = 0; i < hosts.length; i++) {
        arrayClients[i] = redis.createClient(6379, hosts[i], {no_ready_check: true})
    }
    //return cluster
}
clients()
var clusterClients = function() {
//    for(var i = 0; i < arrayClients.length; i++) {
//        return arrayClients[i.toString()]
//    }

    for(id in arrayClients) {
        return arrayClients[1]
    }

}

//clusterClients()
//clusterClients().lrange('users:id', 0, -1, redis.print)

//console.log(arrayClients['0'])


for(keys in arrayClients) {
    console.log(arrayClients[keys])
    arrayClients[keys].lrange('users:id', 0, -1, function(err, lrange) {
        for(var i = 0; i < lrange.length; i++) {
            arrayClients[keys].hgetall('users:' + lrange[i], function(err, hgetAllRep) {
                console.log(hgetAllRep)
            })
        }
    })
}


//arrayClients[0].lrange('users:id', 0, -1, function(err, lrange) {
//    for(var i = 0; i < lrange.length; i++) {
//        arrayClients[0].hgetall('users:' + lrange[i], function(err, hgetAllRep) {
//            console.log(hgetAllRep)
//        })
//    }
//})