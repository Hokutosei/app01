var redis = require('redis')

var util = require("util");
var hosts = require('./testing/redisdb.js')
var jpUtils = require('./utils')


hosts.distribute().forEach(function(element){
    var host = element['host']
    element.debug_mode = true

    element.monitor(function (err, res) {
        if(err) { console.log(err) }
        console.log("Entering monitoring mode." + host);
    });

    element.on("monitor", function (time, args) {
        console.log(host + ' : ' +time + ": " + util.inspect(args));
    });

})
