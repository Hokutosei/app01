'use strict';

//var app = angular.module('jpWorkerCard');
var app = angular.module('jpWorkerCard', []);


app.factory('socket', function($rootScope) {
    //var socket = io.connect('http://localhost:8888');
//    var socket = io.connect('http://localhost:5000');
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args)
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

app.controller('AppCtrl', function($scope, socket, $http) {
    $scope.user = '', $scope.login_user = '';

    //socket.emit('connection');
    socket.emit('connection')
    $scope.submitUserReg = function() {
        //console.log($scope.user['name'])
        socket.emit('userRegistrationNew', $scope.user);
        //socket.emit('userRegistration', userData )
    }

    $scope.login = function() {
//        socket.emit('login', $scope.login_user)
        $http.post('/login', $scope.login_user).success(function(response) {
            console.log(response)
            console.log(typeof response)
            $scope.loginMessage = response['user'].username
        })
    }


    $scope.flushDb = function() {
        socket.emit('flushDb')
    }
    socket.on('users_list', function(data) {
        $scope.userLists = [];
        parseObject(data)
    })

    function parseObject(objects) {
        //console.log(data);
        console.log(objects.data.length)
        console.log($scope.userLists.length)
        for(var i = 0; i < objects.data.length; i++) {
            if (objects.data[i].name != undefined) {
                //console.log(objects.data[i].name)
                $scope.userLists.push(objects.data[i].name)
            }
        }
    }


    $(function() {
        $('#tabs').tabs();
    })

    socket.on('thisUserData', function(data) {
        console.log(data)
        $scope.userNotAvailable = ''
        if(data) {
            //make a transition here after registration
            //$('.registration_login').hide()
        }
    })

    socket.on('lrangeReply', function(data) {
//        console.log(data)
    })

    socket.on('userNotAvailable', function(data) {
       $scope.userNotAvailable = data.data
    });

    socket.on('inforReply', function(data) {
//        console.log(data.data)
        $scope.serverData = []
        $.each(data.data, function(k, val) {
//            console.log(k + ' : ' + val)
            $scope.serverData.push(k + ' : ' + val)
        })
    });

    socket.on('user_disconnected', function(data) {
        console.log(data)
    })


    socket.on('successLogin', function(data) {
        console.log(data)
    })

    socket.on('invalidAccount', function(data) {
        console.log(data)
    })

})

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
