const video = document.getElementById('videos')
let letsPlay = false
let letsPause = false
let adminPlay = false
let adminPause = false

video.onplay = () => {
    if (!adminPlay) {
        console.log("Trying to play Video... this is your playPermit: " + JSON.stringify(letsPlay))
        if (!letsPlay) {
            adminPause = true;
            video.pause();
            console.log("Testing Code...")

            const requestOptions = {
                "method": "GET",
                "mode": "cors",
                "redirect": "follow"
            };

            const currentTime = video.currentTime;
            const neatTime = currentTime.toFixed(4).substring(0,5);
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
                "method": "GET",
                "mode": "cors",
                "redirect": "follow"
            };

            fetch(cacheServiceEndpoint + "videoPause" + "?sessionKey=" + sessionKey + "&print=" + print, requestOptions)
        } else letsPause = false
    } else adminPause = false

}