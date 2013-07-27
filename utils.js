var prettyjson = require('prettyjson')

module.exports = {
    log: function(str) {
        console.log(str)
    },
    logJson: function(str) {
        console.log(prettyjson.render(str, {
            keysColors: 'blue'
        }))
    },
    removeString: function(str, fromStr) {
        return str.substring(0, str.indexOf(fromStr));
    },
    query: function() {
        var arr = [];
        for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
        return arguments.length == 1 ? arr[0] : arr.join(':');
    },
    displayQuery: function() {
        var arr = [];
        for(var i = 0; i < arguments.length; i++) { arr.push(arguments[i]) }
        return arguments.length == 1 ? arr[0] : arr.join(' : ');
    }

}