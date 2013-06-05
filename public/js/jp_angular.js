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
    $scope.submitRegistration = function() {
        socket.emit('userRegistration', {name: $scope.nameField, job_title: $scope.jobTitle, job_description: $scope.jobDescription})
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
        //if ($scope.userLists.length < objects.data.length) { $scope.userLists = [] }
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

})
