const express = require('express')
const app = express()
const http = require('http').createServer(app)
const cookie = require('cookie')
const io = require('socket.io')(http)
const fs = require('fs')
const path = require('path')
const {UserHandler, Users} = require('./assets/users.js')
const {TelestrationsHandler, Telestrations, Telestration, TelestrationState, TelestrationSectionType} = require('./assets/telestrations.js')

const controllerIO = io.of('/controller')
const loginIO = io.of('/login')
const gameIO = io.of('/game')

// Get Server IP address
const ip = require('ip').address()
const port = 80

const userHandler = new UserHandler(__dirname + '/data/users.json')
const telestrationsHandler = new TelestrationsHandler(__dirname + '/data/gamedata.json')

const GameMode = {
    PAUSED: 0,
    INITIAL: 1,
    TELESTRATING: 2,
    RATING: 3,
    SHOWING_BEST: 4
}

let currentGameMode = GameMode.PAUSED
let lastGameMode = GameMode.PAUSED

// Add static pages path
app.use('/pages', express.static(path.join(__dirname, 'pages')))

// Add static assets path
app.use('/assets', express.static(path.join(__dirname, 'assets')))

app.get('/controller', (req, res) => {
    res.writeHead(307, {Location: '/pages/controller/controller.html'})
    res.end()
});

app.get('/', (req, res) => {
    res.writeHead(307, {Location: '/pages/login/login.html'})
    res.end()
})

app.get('/game', (req, res) => {
    res.writeHead(307, {Location: '/pages/game/game.html'})
    res.end()
})

controllerIO.on('connection', socket => {
    socket.on('start-game', () => {
        if (currentGameMode === GameMode.PAUSED) {
            currentGameMode = GameMode.INITIAL
        }
    })

    socket.on('pause-game', () => {
        currentGameMode = GameMode.PAUSED
    })

    socket.on('reset-game', () => {

    })

    socket.on('remove-player', message => {
        let data = JSON.parse(message)

        userHandler.getUsers(users => {
            users.userDisconnected(users.getUserID(data.name))

            return users
        })
    })
})

loginIO.on('connection', socket => {
    socket.on('name', message => {
        let data = JSON.parse(message)

        userHandler.getUsers(users => {
            let cookies = undefined
            try {
                cookies = cookie.parse(socket.request.headers.cookie)
            } catch (e) {}

            let id = ''
            if (cookies === undefined || cookies.id === undefined) {
                do {
                    id = socket.conn.remoteAddress + Math.random().toString(36).substring(2, 15)
                } while (users.includes(id))
            } else {
                id = cookies.id
            }
            if (!users.includes(id)) {
                users.createUser(id, data.name)
            } else {
                users.userDisconnected(id)
                users.setUserProperty(id, 'name', data.name)
            }

            socket.emit('id', JSON.stringify({id: id}))

            return users
        })
    })
})

gameIO.on('connection', socket => {

    let id = undefined

    try {
        id = cookie.parse(socket.handshake.headers.cookie).id
    } catch (e) {

    }

    userHandler.getUsers(users => {
        if(id === undefined || !users.includes(id)) {
            socket.emit('redirect', JSON.stringify({location: ''}))
            return
        }

        users.userConnected(id)

        socket.emit('name', users.getUserProperty(id, 'name'))

        return users
    })

    socket.on('image', message => {
        let data = JSON.parse(message)
        console.log(data.image)
        gameIO.emit('image', message)
    })

    socket.on('text', message => {
        let data = JSON.parse(message)
        console.log(data.text)
        gameIO.emit('text', message)
    })

    socket.on('disconnect', () => {
        userHandler.getUsers(users => {
            if(id !== undefined) {
                users.userDisconnected(id)
            }
            return users
        })
    })
})

function sendPlayerList() {
    userHandler.getUsers(users => {
        let players = {}

        for(let user of Object.keys(users.getUsers())) {
            if(users.getUserProperty(user, 'connected')) {
                players[users.getUserProperty(user, 'name')] = true
            }
        }

        controllerIO.emit('players-list', JSON.stringify({players: players}))
    })
}

setInterval(() => {
    let nextGameMode = currentGameMode

    sendPlayerList()

    switch (currentGameMode) {
        case GameMode.PAUSED:
            break
        case GameMode.INITIAL:
            if(lastGameMode !== GameMode.INITIAL) {
                telestrationsHandler.getTelestraions(telestrations => {
                    telestrations.clearTelestrations()
                    gameIO.emit('enter-initial')
                    return telestrations
                })
            }
            break
        case GameMode.TELESTRATING:
            break
        case GameMode.RATING:
            break
        case GameMode.SHOWING_BEST:
            break
    }

    lastGameMode = currentGameMode
    currentGameMode = nextGameMode
}, 100)

http.listen(port, () => {
    console.log(`Listening on http://${ip}:${port}`)
})
