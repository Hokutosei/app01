var redis = require('redis')

var util = require("util");
var hosts = require('./testing/redisdb.js')
console.log(hosts.length)
hosts.distribute().forEach(function(element){
    element.monitor(function (err, res) {
        if(err) { console.log(err) }
        console.log("Entering monitoring mode." + element['host']);
    });

    element.on("monitor", function (time, args) {
        console.log(element['host'] + ' : ' +time + ": " + util.inspect(args));
    });
})
