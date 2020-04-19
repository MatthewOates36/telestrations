const express = require('express')
const app = express()
const http = require('http').createServer(app)
const cookie = require('cookie')
const io = require('socket.io')(http)
const fs = require('fs')
const path = require('path')
const {UserHandler, UserTracker, Users} = require('./assets/users.js')
const {TelestrationsHandler, Telestrations, Telestration, TelestrationState, TelestrationSectionType} = require('./assets/telestrations.js')

const controllerIO = io.of('/controller')
const loginIO = io.of('/login')
const gameIO = io.of('/game')

// Get Server IP address
const ip = require('ip').address()
const port = 80

const userHandler = new UserHandler(__dirname + '/data/users.json')
const userTracker = new UserTracker(5)
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

let usersInRound = []
let usersInCycle = []
let usersDNF = []
let workingUsers = []

let bestTelestrations = []

let currentPeriodDuration = 0
let currentPeriodStartTime = 0

userHandler.getUsers(users => {
    for(let id of Object.keys(users.getUsers())) {
        users.setUserProperty(id, 'connected', false)
    }
    return users
})

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

    sendPlayerList()

    socket.on('start-game', () => {
        if (currentGameMode === GameMode.PAUSED) {
            currentGameMode = GameMode.INITIAL
        }
    })

    socket.on('pause-game', () => {
        currentGameMode = GameMode.PAUSED
    })

    socket.on('next', () => {
        updateCompletedUsers()
    })

    socket.on('reset-game', () => {

    })

    socket.on('remove-player', message => {
        let data = JSON.parse(message)

        userHandler.getUsers(users => {
            let user = users.getUserID(data.name)

            if(user === undefined) {
                return
            }

            let socket = gameIO.sockets[users.getUserProperty(user, 'socket')]
            if (socket !== undefined) {
                socket.emit('redirect', JSON.stringify({location: ''}))
            }

            sendPlayerList()
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
        users.setUserProperty(id, 'socket', socket.id)

        socket.emit('name', users.getUserProperty(id, 'name'))

        switch (currentGameMode) {
            case GameMode.INITIAL:
                if(!usersInRound.includes(id)) {
                    socket.emit('initial')
                    sendTime(socket)
                }
                break
            case GameMode.TELESTRATING:
                let cycle = userTracker.getCurrentCycle()

                if(Object.keys(cycle).includes(id)) {
                    telestrationsHandler.getTelestrations(telestrations => {
                        let currentSection = telestrations.getTelestration(cycle[id]).getCurrentSection()
                        if(currentSection.type === TelestrationSectionType.WORD) {
                            socket.emit('word', JSON.stringify({word: currentSection.data.word}))
                        } else if(currentSection.type === TelestrationSectionType.INITIAL || currentSection.type === TelestrationSectionType.IMAGE) {
                            socket.emit('image', JSON.stringify({image: currentSection.data.image}))
                        }
                    })
                    sendTime(socket)
                } else {
                    socket.emit('loading')
                }
                break
            case GameMode.RATING:
                if(workingUsers.includes(id)) {
                    telestrationsHandler.getTelestrations(telestrations => {
                        if (telestrations.includes(id)) {
                            socket.emit('rate', JSON.stringify(telestrations.getTelestration(id).getAllData()))
                        }
                    })
                }
                break
            case GameMode.SHOWING_BEST:
                sendBestTelestration(socket)
            default:
                socket.emit('loading')
                break
        }

        userHandler.setUsers(users, () => {
            sendPlayerList()
        })
    })

    socket.on('initial', message => {
        let data = JSON.parse(message)

        if(currentGameMode === GameMode.INITIAL) {
            usersInRound.push(id)
        }

        telestrationsHandler.getTelestrations(telestrations => {

            telestrations.createTelestration(id)
            telestrations.getTelestration(id).addSection(id, TelestrationSectionType.INITIAL, data)

            return telestrations
        })
    })

    socket.on('image', message => {
        let data = JSON.parse(message)
        telestrationsHandler.getTelestrations(telestrations => {
            telestrations.getTelestration(userTracker.getCurrentCycle()[id]).addSection(id, TelestrationSectionType.IMAGE, data)
            userFinished(id)
            return telestrations
        })
    })

    socket.on('word', message => {
        let data = JSON.parse(message)
        telestrationsHandler.getTelestrations(telestrations => {
            telestrations.getTelestration(userTracker.getCurrentCycle()[id]).addSection(id, TelestrationSectionType.WORD, data)
            userFinished(id)
            return telestrations
        })
    })

    socket.on('rate', message => {
        let data = JSON.parse(message)
        telestrationsHandler.getTelestrations(telestrations => {
            if(!telestrations.includes(id)) {
                return
            }
            telestrations.getTelestration(id).setRating(data.rating)
            userFinished(id)
            return telestrations
        })
    })

    socket.on('dnf', () => {
        userDNF(id)
    })

    socket.on('disconnect', () => {
        userHandler.getUsers(users => {
            if(id !== undefined) {
                users.userDisconnected(id)
            }
            userHandler.setUsers(users, () => {
                sendPlayerList()
            })
        })
    })
})

function sendPlayerList() {
    userHandler.getUsers(users => {
        let players = {}

        for(let user of Object.keys(users.getUsers())) {
            if(users.getUserProperty(user, 'connected')) {
                if(currentGameMode === GameMode.INITIAL) {
                    players[users.getUserProperty(user, 'name')] = usersInRound.includes(user)
                } else {
                    players[users.getUserProperty(user, 'name')] = !workingUsers.includes(user)
                }
            }
        }

        controllerIO.emit('players-list', JSON.stringify({players: players}))
    })
}

function updateCompletedUsers() {
    let completedUsers = [...usersInCycle]
    for(let user of workingUsers) {
        if(completedUsers.includes(user)) {
            completedUsers.splice(completedUsers.indexOf(user), 1)
        }
    }
    userTracker.setUsersCompletedThisCycle(completedUsers)
}

function allUsersReady() {
    let users = userHandler.getUsersSync()

    for(let id of Object.keys(users.getConnectedUsers())) {
        if(!usersInRound.includes(id) && !usersDNF.includes(id)) {
            return false
        }
    }

    return true
}

function allUsersDone() {
    for(let id of usersInCycle) {
        if(workingUsers.includes(id) && !usersDNF.includes(id)) {
            return false
        }
    }

    return true
}

function userFinished(id) {
    if(workingUsers.includes(id)) {
        workingUsers.splice(workingUsers.indexOf(id), 1)
    }
}

function userDNF(id) {
    usersDNF.push(id)
}

function resetRound() {
    workingUsers = [...usersInRound]
    usersDNF = []
}

function sendTime(io = gameIO) {
    io.emit('time', JSON.stringify({
        duration: currentPeriodDuration,
        offset: getCurrentTime() - currentPeriodStartTime
    }))
}

function sendBestTelestration(io = gameIO) {
    telestrationsHandler.getTelestrations(telestrations => {
        userHandler.getUsers(users => {
           let data = telestrations.getTelestration(bestTelestrations[bestTelestrations.length - 1]).getAllData()
            /*data.name1 = '(' + users.getUser(data.id1).getProperty('name') + ')'
            data.name2 = '(' + users.getUser(data.id2).getProperty('name') + ')'
            data.name3 = '(' + users.getUser(data.id3).getProperty('name') + ')'
            data.name4 = '(' + users.getUser(data.id4).getProperty('name') + ')'
            data.name5 = '(' + users.getUser(data.id5).getProperty('name') + ')'
            data.name6 = '(' + users.getUser(data.id6).getProperty('name') + ')'
            data.name7 = '(' + users.getUser(data.id7).getProperty('name') + ')'*/
            io.emit('display', JSON.stringify(data))
        })
    })
}

function startTimer(time) {
    currentPeriodDuration = time
    currentPeriodStartTime = getCurrentTime()
    sendTime()
}

function getCurrentTime() {
    return new Date().getTime()
}

setInterval(() => {
    let nextGameMode = currentGameMode

    switch (currentGameMode) {
        case GameMode.PAUSED:
            if(lastGameMode !== GameMode.PAUSED) {
                gameIO.emit('loading')
            }
            break
        case GameMode.INITIAL:
            if(lastGameMode !== GameMode.INITIAL) {
                usersInRound = []
                workingUsers = []
                telestrationsHandler.getTelestrations(telestrations => {
                    telestrations.clearTelestrations()
                    gameIO.emit('initial')
                    startTimer(90000)
                    return telestrations
                })
            } else if(allUsersReady()) {
                if(usersInRound.length < 1) {
                    nextGameMode = GameMode.PAUSED
                } else {
                    nextGameMode = GameMode.TELESTRATING
                }
            }
            break
        case GameMode.TELESTRATING:
            if(userTracker.isComplete() && lastGameMode === GameMode.TELESTRATING) {
                nextGameMode = GameMode.RATING
            } else if(allUsersDone() || lastGameMode !== GameMode.TELESTRATING) {
                if(lastGameMode === GameMode.INITIAL) {
                    userTracker.setUsers(usersInRound)
                } else {
                    updateCompletedUsers()
                }
                resetRound()

                telestrationsHandler.getTelestrations(telestrations => {
                    userHandler.getUsers(users => {
                        let cycle = userTracker.getNextCycle()

                        usersInCycle = Object.keys(cycle)

                        for(let user of workingUsers) {
                            if(!usersInCycle.includes(user)) {
                                userFinished(user)
                            }
                        }

                        let time = 20000

                        for (let user of usersInCycle) {
                            let socket = gameIO.sockets[users.getUserProperty(user, 'socket')]
                            if (socket !== undefined) {
                                let currentSection = telestrations.getTelestration(cycle[user]).getCurrentSection()
                                if(currentSection.type === TelestrationSectionType.WORD) {
                                    time = 60000
                                    socket.emit('word', JSON.stringify({word: currentSection.data.word}))
                                } else if(currentSection.type === TelestrationSectionType.INITIAL || currentSection.type === TelestrationSectionType.IMAGE) {
                                    socket.emit('image', JSON.stringify({image: currentSection.data.image}))
                                }
                            }
                        }

                        startTimer(time)
                    })
                })
            }
            break
        case GameMode.RATING:
            if(lastGameMode !== GameMode.RATING) {

                resetRound()
                usersInCycle = [...usersInRound]

                telestrationsHandler.getTelestrations(telestrations => {
                    userHandler.getUsers(users => {
                        for (let telestrationId of Object.keys(telestrations.getTelestrations())) {
                            let socket = gameIO.sockets[users.getUserProperty(telestrationId, 'socket')]
                            if (socket !== undefined) {
                                socket.emit('rate', JSON.stringify(telestrations.getTelestration(telestrationId).getAllData()))
                            }
                        }
                        startTimer(20000)
                    })
                })
            } else if(allUsersDone()) {
                nextGameMode = GameMode.SHOWING_BEST
            }
            break
        case GameMode.SHOWING_BEST:
            if(lastGameMode !== GameMode.SHOWING_BEST) {
                resetRound()
                usersInCycle = [...usersInRound]

                telestrationsHandler.getTelestrations(telestrations => {
                    bestTelestrations = telestrations.getBestTelestrations()

                    sendBestTelestration()

                    startTimer(10000)
                })
            } else if(allUsersDone()) {
                resetRound()
                usersInCycle = [...usersInRound]

                bestTelestrations.splice(bestTelestrations.length - 1)

                if(bestTelestrations.length < 1) {
                    nextGameMode = GameMode.INITIAL
                } else {
                    sendBestTelestration()

                    startTimer(10000)
                }
            }
            break
    }

    lastGameMode = currentGameMode
    currentGameMode = nextGameMode
}, 200)

setInterval(sendPlayerList, 2000)

http.listen(port, () => {
    console.log(`Listening on http://${ip}:${port}`)
})
