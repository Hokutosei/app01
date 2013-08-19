#!/usr/bin/env node

var argv = require('optimist').argv
    , myUtils = require('./utils')
    , log = function(str) { myUtils.log(str)}
    , startTime = new Date()
    , prettyjson = require('prettyjson')
    , redisMaster = require('./testing/redisdb').configServer
    , async = require('async')
    , redisHosts = require('./testing/redisdb').distribute();


// REQUIRED OPTIONS
var date = getDate()


if(argv.timeout == undefined) {
    log('Enter --timeout');
    return
} else {
    var timeout = argv.timeout;
    timeRange(timeout, function(err, calculatedTime) {
        var totalTimeout = parseFloat(calculatedTime.hour + '.' + calculatedTime.min).toFixed(2);

        log(workingHours(totalTimeout))
        saveToDb(workingHours(totalTimeout))
    })
}

function timeRange(time, callback) {
    var timeOutArr = time.split(/:/)
        , timeHour = timeOutArr[0]
        , timeOutMins = time.substring(time.indexOf(':') + 1)
        , calculatedTime;

    switch (true) {
        case  timeOutMins >= 1 && timeOutMins <= 15:
            calculatedTime = { hour: timeHour, min: 00 };
            break;
        case timeOutMins >= 16 && timeOutMins <= 29:
            calculatedTime = { hour: timeHour, min: 15 };
            break;
        case timeOutMins >= 30 && timeOutMins <= 44:
            calculatedTime = { hour: timeHour, min: 50 };
            break;
        case timeOutMins >= 45 && timeOutMins <= 59:
            calculatedTime = { hour: timeHour, min: 75 };
            break;
        default:
            calculatedTime = { hour: timeHour, min: 00 };
            break;
    }
    callback(null, stringToInteger(calculatedTime))
}

function stringToInteger(data) {
    var newData = {};
    for(key in data) { newData[key] = parseInt(data[key]) };
    return newData
}

function workingHours(timeOut) {
    var timeIn = function() {
        if(argv.timein != undefined) {
            return objectToString(stringTimeToInt(argv.timein))
        } else { return parseInt('10.00').toFixed(2) }
    }

    var breakTime = function() {
        return integerToFixed('1')
    }


    var data = {
        TimeIn: timeIn(),
        Timeout: timeOut,
        workingHours: (timeOut - timeIn()) - breakTime(),
        date: date
    }

    return data
}

function integerToFixed(int) {
    return parseInt(int).toFixed(2)
}

function getDate() {
    var date;
    if(argv.date != undefined) {
        //TODO MAKE VALIDATION HERE
        date = new Date((argv.date).split('.'))
    } else {
        var timeout = argv.timeout.split(/:/);
        date = new Date();
        date.setHours(timeout[0]);
        date.setMinutes(timeout[1])
    }
    return myUtils.timeString(date)
}

function saveToDb(dataObject) {
    var currentId
        , monthList
        , currentMonth = myUtils.currentMonth()
        , currentYear = myUtils.currentYear()
        , monthKey = myUtils.query('daily', currentYear, currentMonth)

    async.series({
        id: function(callback) {
            redisMaster.get(myUtils.query('daily', 'work', 'id'), function(err, getReply) {
                currentId = getReply
                callback(null, getReply)
            })
        },
        saveDate: function(callback) {
            callback(null, 'done')
        },
        findOrSetMonth: function(callback) {
            redisMaster.lrange(monthKey, 0, -1, function(err, lrangeReply) {
                log(lrangeReply)
                if(lrangeReply.length == 0) {
                    redisMaster.rpush(monthKey, currentId, function(err, rpushReply) {
                        redisMaster.lrange(monthKey, 0 , -1, redisMaster.print)
                        monthList = monthKey
                    })
                }
                callback(null, myUtils.query('daily', currentYear, currentMonth))
            })
        },
        saveToRedis: function(callback) {
//            redisMaster.hmset(myUtils.query('daily', currentYear, currentMonth, currentId), dataObject, function(err, hmsetReply) {
//                callback(null, hmsetReply)
//            })
            redisHosts.forEach(function(host) {
                host.hmset(myUtils.query('daily', currentYear, currentMonth, currentId), dataObject, function(err, hmsetReply) {
                    log(hmsetReply)
                });
                callback(null, 'done')
            })

        },
        pushToMonthListAndUpdateId: function(callback) {
            redisMaster
        }
    }, function(err, results) {
        log(results);
        redisMaster.quit()
        redisHosts.forEach(function(host) {
            host.quit()
        })
    })
}

function stringTimeToInt(time) {
    var calculatedTime;
    var timeData = time.split(/:/);

    switch (true) {
        case  timeData[1] >= 1 && timeData[1] <= 15:
            calculatedTime = { hour: timeData[0], min: 00 };
            break;
        case timeData[1] >= 16 && timeData[1] <= 29:
            calculatedTime = { hour: timeData[0], min: 15 };
            break;
        case timeData[1] >= 30 && timeData[1] <= 44:
            calculatedTime = { hour: timeData[0], min: 50 };
            break;
        case timeData[1] >= 45 && timeData[1] <= 59:
            calculatedTime = { hour: timeData[0], min: 75 };
            break;
        default:
            calculatedTime = { hour: timeData[0], min: 00 };
            break;
    }
    return stringToInteger(calculatedTime)

}

function objectToString(object) {
    return Object.keys(object).map(function(x){return object[x];}).join('.');
}