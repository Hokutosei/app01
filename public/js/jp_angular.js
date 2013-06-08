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

app.controller('AppCtrl', function($scope, socket) {

    //socket.emit('connection');
    socket.emit('connection')
    socket.on('helloServer', function(data) {
        console.log(data.message)
    })
    socket.emit('testing', {message: 'test'})
    $scope.submitUserReg = function() {
        //console.log($scope.user['name'])
        $scope.user;
        socket.emit('userRegistration', $scope.user)
        //socket.emit('userRegistration', userData )
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

    socket.on('userHsetData', function(data) {
        console.log(data)
    })

    socket.on('myCurrentUser', function(data) {
        console.log(data)
    })

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
        console.log(data)
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

})
