var redis = require('redis')

     var util = require("util");
	var hosts = require('./testing/redisdb.js')
	console.log(hosts.length)
	hosts.forEach(function(element){
	    element.monitor(function (err, res) {
	    	console.log("Entering monitoring mode.");
            });

            element.on("monitor", function (time, args) {
		console.log(element['host'])
        	console.log(time + ": " + util.inspect(args));
    	    });
	})	
