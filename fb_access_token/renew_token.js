var token = 'CAAEgAJT96bwBAKn34AhMQAXTuxdYSBm30urw99IXScGON1utwJ78ZCrkjvwKGL1UdNTYZCmuGdZBAmAPh7HHZCvrx62az8MdhQGZAZBZAFZAvZAeYy3IZBbXI7n1qEnitfL3D0BJg2dalZA6AimZBtgAkRSa'
var appid = '316661848467900',
    secret = '1ac6a50ef0d6c6f6ba14b2079f2e3672'

var https = require('https')

function longLiveMyToken(token, appId, clientSecret) {
    var req = https.request({
        host: 'graph.facebook.com',
        path: '/oauth/access_token',
        method: 'POST'
    }, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            console.log('======================')
            var data = JSON.stringify(chunk)
            console.log(JSON.parse(data))
            console.log(chunk);
        });
        res.on('end', function() {
            console.log('status: '+res.status);
        });
    });
    req.end('grant_type=fb_exchange_token'
        +'&client_id='+encodeURIComponent(appId)
        +'&client_secret='+encodeURIComponent(clientSecret)
        +'&fb_exchange_token='+encodeURIComponent(token)
    );
};

setInterval(function() { longLiveMyToken(token, appid, secret) }, 6000)