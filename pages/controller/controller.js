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
            socket.emit('remove-player', JSON.stringify({name: e.target.innerText}))
        })
        playersUl.append(playerItem)
    }
})

const startGameButton = document.getElementById('start-game-btn')
startGameButton.addEventListener('click', () => {
    socket.emit('start-game')
})

const pauseGameButton = document.getElementById('pause-game-btn')
pauseGameButton.addEventListener('click', () => {
    socket.emit('pause-game')
})

const nextQuestionButton = document.getElementById('next-question-btn')
nextQuestionButton.addEventListener('click', () => {
    socket.emit('next-question')
})

const resetGameButton = document.getElementById('reset-game-btn')
resetGameButton.addEventListener('click', () => {
    if(confirm('Are you sure you want to reset the game?')) {
        socket.emit('reset-game')
    }
})