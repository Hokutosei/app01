//navigator.getUserMedia ||
//(navigator.getUserMedia = navigator.mozGetUserMedia ||
//    navigator.webkitGetUserMedia || navigator.msGetUserMedia);

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var constraints = {audio: false, video: true};


if (navigator.getUserMedia) {
    navigator.getUserMedia({
        video: true,
        audio: true
    }, onSuccess, onError);
} else {
    alert('getUserMedia is not supported in this browser.');
}

function onSuccess() {
    alert('Successful!');
    window.stream = stream; // stream available to console

    var video = document.getElementById('webcam');

    var videoSource;
    if(window.webkitURL) {
        videoSource = window.webkitURL.createObjectURL(stream);
    } else {
        source = stream
    }

    video.autoplay = true;
    video.src = videoSource

//    window.stream = stream; // stream available to console
//    var video = document.querySelector("video");
//    video.src = window.URL.createObjectURL(stream);
//    video.play();


}

function onError() {
    alert('There has been a problem retrieving the streams - did you allow access?');
}

navigator.getUserMedia(constraints, successCallback, errorCallback);


//navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
//
//var constraints = {audio: false, video: true};
//
//function successCallback(stream) {
//    window.stream = stream; // stream available to console
//    var video = document.querySelector("video");
//    video.src = window.URL.createObjectURL(stream);
//    video.play();
//}
//
//function errorCallback(error){
//    console.log("navigator.getUserMedia error: ", error);
//}
//
//navigator.getUserMedia(constraints, successCallback, errorCallback);
//
