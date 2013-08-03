var redis = require('redis')
var myUtils = require('./utils')
var log = function(str) {
    myUtils.log(str)
}

var util = require("util");
var hosts = require('./testing/redisdb.js')
hosts.slaves().forEach(function(element){
    var host = element['host'] + ':' + element['port'];
    element.monitor(function (err, res) {
        if(err) { console.log(err) }
        console.log("Entering monitoring mode." + host);
    });

    element.on("monitor", function (time, args) {
        console.log(host + ' : ' +time + ": " + util.inspect(args));
    });
    element.quit()
})
