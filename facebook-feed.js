var https = require('https');

var access_token = 'CAACEdEose0cBAEBy9Y03ZBcxMu6zn5iv5SHiowbzAUiDN8ZBrufbIQvYQoghyj0IoGMZAWY5NQ1jI3rfT39ZCY5PBZCR0bbacbyxSfgdLObZCWIsiYM94K2w6zY6N2uqrFJUqCxHo91uO1s2YMclS7GMLW32Oejr8ZD';

function facebook_feed() {
    https.get('https://graph.facebook.com/1638322655/home?access_token=' + access_token, function(response) {
        var data = '';
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            var obj = JSON.parse(data);
            console.log(obj)
        });

    })
}

setInterval(function() { facebook_feed() }, 10000)