var http = require('http')

var loop_delay = 10000

function getData() {
    http.get('http://api.openweathermap.org/data/2.5/weather?q=Akiruno-shi', function(response) {
        response.on('data', function(chunk) {
            //console.log(JSON.parse(chunk).main)
            var dataArr = JSON.parse(chunk).main
            console.log(parseInfo(JSON.stringify(dataArr)))
//            for(var i = 0; i < dataArr.length; i++) {
//                console.log(JSON.parse(chunk).main[i])
//                if(dataArr[i] == 'temp') {
//                    console.log(dataArr[i])
//                }
//            }
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
