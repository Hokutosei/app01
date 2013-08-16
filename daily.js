#!/usr/bin/env node

var argv = require('optimist').argv
    , myUtils = require('./utils')
    , log = function(str) { myUtils.log(str)}
    , startTime = new Date()
    , prettyjson = require('prettyjson')
//    , redisHosts = require('./testing/redisdb').distribute()


if(argv.timeout == undefined) {
    log('Enter --timeout')
    return
} else {
    var timeout = argv.timeout
        , timeOutArr = timeout.split(/:/)
        , timeOutMins = timeout.substring(timeout.indexOf(':') + 1);

//    log(timeOutMins)
//    log(timeout.substring(timeout.indexOf(':') + 1) + '-' + (new Date() - startTime) + 'ms');
    timeRange(timeout, function(err, calculatedTime) {
//        log(parseInt(calculatedTime.hour))
//        log(prettyjson.render(calculatedTime))
//        log((totalTimeout - 10.00).toFixed(2))
        var totalTimeout = parseFloat(calculatedTime.hour + '.' + calculatedTime.min).toFixed(2)

        log(workingHours(totalTimeout))
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
            return argv.timein
        } else { return parseInt('10.00').toFixed(2) }
    }

    var breakTime = function() {
        return integerToFixed('1')
    }


    return (timeOut - timeIn()) - breakTime()
}

function integerToFixed(int) {
    return parseInt(int).toFixed(2)
}