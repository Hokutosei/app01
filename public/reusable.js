var myCookie;
//io.set('authorization', function(handshakeData, accept) {
//    console.log(handshakeData.headers.cookie)
////    if(handshakeData.headers.cookie) {
////        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
////        handshakeData.sessionID = connect.utils.
////    }
//
//    if (handshakeData.headers.cookie) {
//
//        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
//
//        handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');
//
//        if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
//            return accept('Cookie is invalid.', false);
//        }
//
//    } else {
//        return accept('No cookie transmitted.', false);
//    }
//
//    accept(null, true);
//    console.log('my cookie ' + handshakeData.cookie['express.sid'])
//    myCookie = handshakeData.cookie['express.sid']
//})
