var redis = require('redis');
var globalIp = '126.15.225.128' || '10.0.1.2';

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

var slaves = [
    {
        server: 'slave-master-3-6379',
        ip: 6379,
        address: '10.0.1.3'
    },
    {
        server: 'slave-master-3-6380',
        ip: 6380,
        address: '10.0.1.3'
    },
    {
        server: 'slave-master-3-6381',
        ip: 6381,
        address: '10.0.1.3'
    }
]


var hosts = function(hostArr) {
    var serverHost =[];
    hostArr.forEach(function(host) {
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


module.exports = {
    distribute: function() {
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
    },
    slaves: function() {
        var serverHost =[];
        slaves.forEach(function(host) {
            var client = redis.createClient(host['ip'], host['address'], function(err, Reply) {
                if(err) { 'Could not connect to ' + host['server'] }
                console.log('Connected to ' + host['server'])
            });
            if(host['server'] == 'garantia') { client.auth('jinpol') }
            serverHost.push(client)
        });
        return serverHost

    },
    'masterSlaves': function() {
        var mergedHosts = options.concat(slaves)
        return hosts(mergedHosts)
    }
}