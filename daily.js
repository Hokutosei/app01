#!/usr/bin/env node

var argv = require('optimist').argv
    , myUtils = require('./utils')
    , log = function(str) { myUtils.log(str)}
    , startTime = new Date();


var timeout = argv.timeout
    , timeOutArr = timeout.split(/:/);


log(timeOutArr)
log(timeout.substring(timeout.indexOf(':') + 1) + '-' + (new Date() - startTime) + 'ms');


