var http = require('http');
var https = require('https')

xml2js = require('xml2js');

var inspect = require('eyes').inspector({maxLength: 1000})

var parser = new xml2js.Parser();
var googleUrl = 'https://news.google.com/news/feeds?pz=1&cf=all&ned=us&hl=en&output=rss'
var url = 'http://www.engadget.com/rss.xml'
http.get(url, function(response) {
    response.on('data', function(chunk) {
        var data = (chunk.toString())
//        console.log(data)
        parser.parseString(data, function (err, result) {
            var jsonData = JSON.stringify(result)
            inspect(result)

        });

    })
})