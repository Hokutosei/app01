var https = require('https');

var globalIp = '60.148.89.178' || '10.0.1.2';
var redis = require('redis');
var client = redis.createClient(6379, globalIp, {no_ready_check: true});
var counter = 0


//var access_token = '1381573655388105|r6JKpamCACYcFFqgVRdx1esIJF';
function facebook_feed(access_token) {
    var startTime = new Date();
    https.get('https://graph.facebook.com/1638322655/home?access_token=' + access_token, function(response) {
        var data = '', finishTime = new Date() - startTime;
        response.on('data', function(chunk){
            data += chunk;
        });
        response.on('end', function(){
            var dataArray = [];

            var obj = JSON.parse(data), objectData = obj['data'];
            var objectLength = Object.keys(obj['data']).length;
            for(var i = 0; i < objectLength; i++) {
                var fromUser = obj['data'][i].from.name;
                var keyData = ['name', 'story', 'message', 'type', 'created_time'];
                obj['data'][i].from.name = {};
                for(var d = 0; d < keyData.length; d++) {
                    if(keyData[d] == 'name') { objectData[i]['name'] = fromUser }
                    obj['data'][i].from.name[keyData[d]] = objectData[i][keyData[d]]
                }
                dataArray.push(obj['data'][i].from.name)
                if(i == objectLength - 1) {
                    //console.log(dataArray)
                    for(var a = 0; a < dataArray.length; a++) {
                        console.log('***************************************************************');
                        console.log(a)
                        console.log(dataArray.reverse()[a]);
                    }
                    counter++;
                    console.log(counter + '***************************************************************')
                    console.log('Took ' + finishTime + ' ms')
                }
            }
        });

    });
    initializeFeeds()
}

function fetchAllData(objectData, i, obj) {
    for(key in objectData[i]) {
        obj['data'][i].from.name[key] = objectData[i][key]
    }
}

initializeFeeds();
function initializeFeeds() {
    client.get('facebook:feed:interval', function(err, getReplyInterval) {
        client.get('facebook:access_token', function(err, getAccessToken) {
            var interval = getReplyInterval
            console.log(getReplyInterval)
            setTimeout(facebook_feed(getAccessToken), interval)
        })
    })
}
