const audio = document.getElementById('audios')
const video = document.getElementById('videos')
let letsPlay = false
let letsPause = false
let adminPlay = false
let adminPause = false

audio.addEventListener('play', function () {
    if (!adminPlay) {
        console.log("Trying to play Video... this is your playPermit: " + JSON.stringify(letsPlay))
        if (!letsPlay) {
            adminPause = true;
            audio.pause();
            console.log("Testing Code...")

            const requestOptions = {
                "method": "PUT",
                "mode": "cors",
                "redirect": "follow"
            };

            const currentTime = audio.currentTime;
            const neatTime = currentTime.toFixed(4).substring(0, 5);
            console.log("Current Time: " + neatTime)
            fetch(cacheServiceEndpoint + "audioStart" + "?sessionKey=" + sessionKey + "&print=" + print + "&time=" + neatTime, requestOptions)
        } else letsPlay = false
    } else adminPlay = false
});

audio.addEventListener('pause', function () {
    if (!adminPause) {
        console.log("Trying to pause Video... this is your playPermit: " + JSON.stringify(letsPause))
        if (!letsPause) {
            adminPlay = true;
            audio.play();
            console.log("Testing Code...")

            const requestOptions = {
                "method": "PUT",
                "mode": "cors",
                "redirect": "follow"
            };

            fetch(cacheServiceEndpoint + "audioPause" + "?sessionKey=" + sessionKey + "&print=" + print, requestOptions)
        } else letsPause = false
    } else adminPause = false
});


video.onplay = () => {
    if (!adminPlay) {
        console.log("Trying to play Video... this is your playPermit: " + JSON.stringify(letsPlay))
        if (!letsPlay) {
            adminPause = true;
            video.pause();
            console.log("Testing Code...")

            const requestOptions = {
                "method": "PUT",
                "mode": "cors",
                "redirect": "follow"
            };

            const currentTime = video.currentTime;
            const neatTime = currentTime.toFixed(4).substring(0, 5);
            console.log("Current Time: " + neatTime)
            fetch(cacheServiceEndpoint + "videoStart" + "?sessionKey=" + sessionKey + "&print=" + print + "&time=" + neatTime, requestOptions)
        } else letsPlay = false
    } else adminPlay = false
}

video.onpause = () => {
    if (!adminPause) {
        console.log("Trying to pause Video... this is your playPermit: " + JSON.stringify(letsPause))
        if (!letsPause) {
            adminPlay = true;
            video.play();
            console.log("Testing Code...")

            const requestOptions = {
                "method": "PUT",
                "mode": "cors",
                "redirect": "follow"
            };

            fetch(cacheServiceEndpoint + "videoPause" + "?sessionKey=" + sessionKey + "&print=" + print, requestOptions)
        } else letsPause = false
    } else adminPause = false

}

/*
video.addEventListener('seeked', function() {
    // Handle the 'seeked' event here
    console.log('User skipped to a new position:', video.currentTime);
});
*/