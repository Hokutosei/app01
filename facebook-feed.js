var https = require('https');

var access_token = 'CAACEdEose0cBAGrKghMYRw8j2BdoOO9rnQW3h8i9LdQn6FqT9cAaoiND55ZAZAex901bQV2BfiZA0jOEfEDa8r5eFdpysKtHZCjVJTVplMoXateCVBG01zCfJXcCYOjEbDosm6Uoc5Xq2xzLwdLz8K71CdGiBmAZD';
function facebook_feed() {
    https.get('https://graph.facebook.com/1638322655/home?access_token=' + access_token, function(response) {
        var data = '';
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
                        //console.log('***************************************************************')
                    }
                }
            }
        });

    })
}

function fetchAllData(objectData, i, obj) {
    for(key in objectData[i]) {
        obj['data'][i].from.name[key] = objectData[i][key]
    }
}

function fetchData() {

}


//id
//from
//story
//picture
//link
//icon
//actions
//privacy
//type
//status_type
//object_id
//created_time
//updated_time




setInterval(function() { facebook_feed() }, 50000)