const container = document.getElementById('container')

fetch('/api/getInstancesData').then(res => res.json())
    .then(data => {
        const { NUM_INSTANCES, BASE_PORT, IP } = data
        createIFrames(NUM_INSTANCES, BASE_PORT, IP)
    })

function createIFrames(numInstances, basePort, ip) {
    container.innerHTML = ''

    for (let i = 0; i < numInstances; i++) {
        let iframe = document.createElement('iframe')
        iframe.src = `http://${ip}:${basePort + i}/controller`
        container.appendChild(iframe)
    }
}

const startGameButton = document.getElementById('start-game-btn')
const startFunc = () => {
    sendMessage('start-game')
}
startGameButton.addEventListener('click', startFunc)

const pauseGameButton = document.getElementById('pause-game-btn')
const pauseFunc = () => {
    sendMessage('pause-game')
}
pauseGameButton.addEventListener('click', pauseFunc)

const nextQuestionButton = document.getElementById('next-btn')
const nextFunc = () => {
    sendMessage('next')
}
nextQuestionButton.addEventListener('click', nextFunc)

const resetGameButton = document.getElementById('reset-game-btn')
const resetFunc = () => {
    if (confirm('Are you sure you want to reset the game?')) {
        sendMessage('reset-game')
    }
}
resetGameButton.addEventListener('click', resetFunc)

function sendMessage(message) {
    const frames = document.getElementsByTagName('iframe')
    Array.from(frames).forEach(frame => {
        frame.contentWindow.postMessage(message, '*')
    })
}