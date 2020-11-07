const socket = io('/controller')

const playersUl = document.getElementById('players-list')
socket.on('players-list', playersJSON => {
    let players = JSON.parse(playersJSON).players
    playersUl.innerHTML = ''
    for (let player of Object.entries(players)) {
        let playerItem = document.createElement('li')
        playerItem.innerText = player[0]
        playerItem.style.color = player[1] ? 'black' : 'grey'
        playerItem.addEventListener('click', e => {
            socket.emit('remove-player', JSON.stringify({ name: e.target.innerText }))
        })
        playersUl.append(playerItem)
    }
})

const startGameButton = document.getElementById('start-game-btn')
const startFunc = () => {
    socket.emit('start-game')
}
startGameButton.addEventListener('click', startFunc)

const pauseGameButton = document.getElementById('pause-game-btn')
const pauseFunc = () => {
    socket.emit('pause-game')
}
pauseGameButton.addEventListener('click', pauseFunc)

const nextQuestionButton = document.getElementById('next-btn')
const nextFunc = () => {
    socket.emit('next')
}
nextQuestionButton.addEventListener('click', nextFunc)

const resetGameButton = document.getElementById('reset-game-btn')
const resetFunc = () => {
    if (confirm('Are you sure you want to reset the game?')) {
        socket.emit('reset-game')
    }
}
resetGameButton.addEventListener('click', resetFunc)

window.addEventListener('message', event => {
    switch (event.data) {
        case 'start-game':
            startFunc()
            break
        case 'pause-game':
            pauseFunc()
            break
        case 'next':
            nextFunc()
            break
        case 'reset-game':
            resetFunc()
            break
    }
})