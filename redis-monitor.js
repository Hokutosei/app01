var hosts = require('./testing/redisdb')
    , myUtils = require('./utils')
    , log = function(str) { myUtils.log(str)}
    , masterslaves = hosts.masterSlaves()
    , counter = 0;



setInterval(function() {
//    myUtils.log(hosts.masterSlaves())
    log('------------------------------------------------------------------------------------' + counter);
    counter++;
    masterslaves.forEach(function(element) {
        element.info(function(err, infoReply) {
            var host = element['host'] == 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com' ? 'garantia' : element['host']

            if(element != undefined || host != undefined) {
                var data = parseInfo(infoReply, host)
                var keys = myUtils.removeString(data['db0'], ',')
                var time = myUtils.timeString(new Date())
                var toLogData = myUtils.displayQuery(time, host, element['port'], data['role'], 'used_mem', data['used_memory_human'], keys)
                var saveData = {
                    time: time,
                    host: host,
                    port: element['port'],
                    role: data['role'],
                    used_mem: data['used_memory_human'],
                    keys: keys
                }
                myUtils.log(toLogData)
            }
            else {
                myUtils.log(host + ':' + element['port'] + ' is undefined in infoReply')
                return
            }
//            element.quit()
        })
    })
}, 180000)


function parseInfo( info, host ) {
    if(info != undefined) {
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
    } else {
        myUtils.log(host + ' returned undefined')
    }
}
