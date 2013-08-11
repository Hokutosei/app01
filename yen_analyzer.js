var hosts = require('./testing/redisdb')
    , myUtils = require('./utils')
    , log = function(str) { myUtils.log(str) }
    , logJson = function(str) { myUtils.logJson(str) }
    , clients = hosts.distribute()
    , masterClient = hosts.configServer
    , analytics_key = 'data-analytics'
    , currency_key = 'currency-yen-php'
    , async = require('async')
    , searchLimit = 50;

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}

var data = [];
function main() {
    var analyticsId, current_id, recent_currency;
    async.series({
        getId: function(callback) {
            masterClient.get(query(analytics_key, 'id'), function(err, getReply) {
                analyticsId = parseInt(getReply)
                callback(null, masterClient['host']+ ':' + getReply)
            })
        },
        current_id: function(callback) {
            function validate_recent_if_null() {
                masterClient.hgetall(query(analytics_key, analyticsId - 1 , currency_key), function(err, hgetAllReply) {
//                    log(hgetAllReply)
                    if(hgetAllReply['currency'] == undefined || hgetAllReply['currency'] == '') {
                        analyticsId--;
                        validate_recent_if_null()
                    } else {
                        current_id = analyticsId;
                        recent_currency = hgetAllReply['currency'];
                        callback(null, analyticsId)
                    }
                })
            }
            validate_recent_if_null()
        },
        countClients: function(callback) {
            callback(null, clients.length)

        },
        collectData: function(callback) {
            var startingId = current_id - searchLimit
            async.series([
                function(callbackInner) {
                    for(var i = startingId; i <= current_id; i++) {
                        clients.forEach(function(client) {
                            client.hgetall(query(analytics_key, i, currency_key), function(err, hgetAllReply) {
                                if(hgetAllReply != null) {
//                            if(data.contains(hgetAllReply['currency']) == false) {
//                                var date = hgetAllReply['time'].toString().replace('GMT+0900 (JST)', '');
//                                data.push({
//                                    currency    : hgetAllReply['currency']
//                                    , date        : date
//                                });
//                                callback(null, data)
//                            }
                                    var date = hgetAllReply['time'].toString().replace('GMT+0900 (JST)', '');
//                                    data.push({
//                                        currency    : hgetAllReply['currency']
//                                        , date        : date
//                                    });
                                }
                                data.push('test')

                            })
                        })
                        callbackInner(null, 'done')
                    }
                },
                function(callbackInner) {
                    callbackInner(null, data.length)
                }
            ], function(err, resultsInner) {
                log(resultsInner)
            });
            callback(null, data)
        }

    }, function(err, results) {
        log(results)
    })
}

main()



Array.prototype.contains = function(k) {
    for(var x = 0; x < this.length; x++) {
        if(this[x].currency == k) {
            return false
        }
    }
    return true
}
