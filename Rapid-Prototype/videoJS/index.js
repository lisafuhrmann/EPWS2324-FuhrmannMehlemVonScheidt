const videoElement = document.getElementById('my-video')

videoElement.onplay = () => {
    console.log("Video started")
    setTimeout(() => videoElement.pause(), 6000)
}

videoElement.onpause = () => {
    console.log("Video paused")
}