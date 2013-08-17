var http = require('http')
    , myUtils = require('.././utils')
    , log = function(str) { myUtils.log(str) }
    , css = require('term-css')
    , fs = require('fs')
    , style = fs.readFileSync('hackernews_style.css', 'utf8')
    , counter = 0
    , async = require('async')
    , redisMaster = require('../testing/redisdb').configServer;


function initialize() {
    redisMaster.get('hackernews:interval', function(err, getReply) {
        counter++;
        var startTime = new Date();
        http.get(' http://api.ihackernews.com/page', function(response) {
            var data = '', obj;
            response.on('data', function(chunk){
                data += chunk;
            });
            response.on('end', function(){
                if(myUtils.isJson(data)) {
                    var obj = JSON.parse(data);
                    var hackerNewsData = obj['items'];
                    for(var i = 0; i < Object.keys(hackerNewsData).length; i++) {
                        var parseData = { id: i,  title: hackerNewsData[i]['title'], link: hackerNewsData[i]['url'] }
                        var fn = css.compile('{id}: {title} \n    {link}', style)
                        log(fn(parseData))
                    }
                    log('Took ' + (new Date() - startTime) + 'ms ' + 'counter ' + counter + ' Time: '  + myUtils.timeString(new Date()) + ' ----------------------------------------')
                } else { log('empty ' + myUtils.timeString(new Date())) }
            });
        })
        setTimeout(initialize, getReply)
    })
}

initialize()
