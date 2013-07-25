var redis = require('redis');
var globalIp = '60.148.89.178' || '10.0.1.2';

var options = [
    {
        server: 'local',
        ip: 6379,
        address: globalIp
    },
    {
        server: 'garantia',
        ip: 14396,
        address: 'pub-redis-14396.us-east-1-3.2.ec2.garantiadata.com'
    }
];

var hosts = function() {
    var serverHost =[];
    options.forEach(function(host) {
        var client = redis.createClient(host['ip'], host['address'], function(err, Reply) {
            if(err) { 'Could not connect to ' + host['server'] }
            console.log('Connected to ' + host['server'])
        });
        if(host['server'] == 'garantia') { client.auth('jinpol') }
        serverHost.push(client)
    });
    return serverHost
};

module.exports = options;


module.exports = hosts();