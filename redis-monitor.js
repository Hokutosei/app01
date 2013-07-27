var redisMonitor = require('redis-monitor')

redisMonitor.on('rti', function (rti) {
    console.log('name', rti.name)
    console.log('info', rti.info)
})

redisMonitor.on('update', function (update) {
    console.log('update', update)
})