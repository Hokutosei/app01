var hosts = require('./testing/redisdb')
    , myUtils = require('./utils')
    , log = function(str) { myUtils.log(str) }
    , logJson = function(str) { myUtils.logJson(str) }
    , clients = hosts.distribute()
    , masterClient = hosts.configServer
    , analytics_key = 'data-analytics'
    , currency_key = 'currency-yen-php'
    , async = require('async')
    , searchLimit = 10;

function query() {
    var arr = [];
    for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
    return arguments.length == 1 ? arr[0] : arr.join(':');
}

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
                    log(hgetAllReply)
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
        collectData: function(callback) {

        }

    }, function(err, results) {
        log(results)
    })
}

main()

