var http = require('http')

var loop_delay = 10000;

var fetchUrl = ['http://api.openweathermap.org/data/2.5/weather?q=Akiruno-shi', 'http://rate-exchange.appspot.com/currency?from=JPY&to=PHP']

function getData() {
    http.get(fetchUrl, function(response) {
        response.on('data', function(chunk) {
            console.log(JSON.parse(chunk))
        })
    })


}
getData()
setInterval(function() { getData()
}, loop_delay)


function parseInfo( info ) {
    var lines = info.split( "\r\n" );
    var obj = { };
    for ( var i = 0, l = info.length; i < l; i++ ) {
        var line = lines[ i ];
        if ( line && line.split ) {
            line = line.split( ":" );
            if ( line.length > 1 ) {
                var key = line.shift( );
                obj[ key ] = line.join( ":" );
            }
        }
    }
    return obj;
}
