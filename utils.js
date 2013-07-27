var prettyjson = require('prettyjson')

module.exports = {
    log: function(str) {
        console.log(str)
    },
    logJson: function(str) {
        console.log(prettyjson.render(str, {
            keysColors: 'blue'
        }))
    }
}