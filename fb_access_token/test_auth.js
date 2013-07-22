var FB = require('fb');


FB.api('oauth/access_token', {
    client_id: '316661848467900',
    client_secret: '1ac6a50ef0d6c6f6ba14b2079f2e3672',
    grant_type: 'client_credentials'
}, function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }

    var accessToken = 'CAAEgAJT96bwBADCpvsMLPBNPsZC1Ueoytxj26UtEtkXAZBnoADZAHvnFsnL2kAZA8FxCDIjlC9PJrYwrii1pQ0ZAfw7mUyy7e9mOIulFQBUxsA71GM1tNlzj7ZBhUGMC2usFeZApkYpBXmN1ZCUTg6KZC';
    console.log(accessToken)
    FB.setAccessToken(accessToken);
    var body = 'using facebook-node-sdk';
//    FB.api('me/feed', 'post', { message: body}, function (res) {
//        if(!res || res.error) {
//            console.log(!res ? 'error occurred' : res.error);
//            return;
//        }
//        console.log('Post Id: ' + res.id);
//    });

});

FB.api('1638322655?fields=id,name,birthday', function (res) {
    if(!res || res.error) {
        console.log(!res ? 'error occurred' : res.error);
        return;
    }
    console.log(res.id);
    console.log(res.name);
    console.log(res)
});


//var http = require('http');
//var querystring = require('querystring');
//
//var code = 'AQChU7klxOWYPk-U4jjyTUgZ2IUdbLV-BVzwkFatjO84AsrpWmt7AmpNZo7awEHBBztV8oTohdYTBXhtSmyI3IcLgALfRaxpW4YcGLzpKcQBHphsFkiXO7VD0RY9K9jIbGJx1LAywyt8YCVzFQ624lGc9TDa78GWysmW2gM9YMgIBouaUICaRi8uyl1upU8vSwZRzoBQ8g9YEuv3O6wjYX2gwUYyaOa_D09h_mywIHqxkOEplROL95iTo7AZq4LvpiVJljRwCDqR_Nz_7de-4ZkWJgKt4S5JcPv94urPW1MHCtYqADoShTqp5rUqKUItiAc'
//
////post_data(data)
//
//var request = require('request');
//
////request.post(
////    'http://localhost:8085/authentication',
////    { query: { code : code} },
////    function (error, response, body) {
////        if (!error && response.statusCode == 200) {
////            console.log(body)
////        }
////        console.log(body)
////    }
////);
//
//var passport = require('passport')
//    , FacebookStrategy = require('passport-facebook').Strategy;
//
//console.log('called')
//passport.use(new FacebookStrategy({
//        clientID: 316661848467900,
//        clientSecret: '1ac6a50ef0d6c6f6ba14b2079f2e3672',
//        callbackURL: "http://localhost:8085/authentication"
//    },
//
//    function(accessToken, refreshToken, profile, done) {
////        User.findOrCreate(..., function(err, user) {
////            if (err) { return done(err); }
////            done(null, user);
////        });
//        console.log(accessToken)
//    }
//));