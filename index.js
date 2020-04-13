const express = require('express')
const app = express()
const http = require('http').createServer(app)
const cookie = require('cookie')
const io = require('socket.io')(http)
const fs = require('fs')
const path = require('path')
const {UserHandler, Users} = require('./assets/users.js')

const loginIO = io.of('/login')
const gameIO = io.of('/game')

// Get Server IP address
const ip = require('ip').address()
const port = 80

const userHandler = new UserHandler(__dirname + '/data/users.json')

// Add static pages path
app.use('/pages', express.static(path.join(__dirname, 'pages')))

// Add static assets path
app.use('/assets', express.static(path.join(__dirname, 'assets')))

app.get('/', (req, res) => {
    res.writeHead(307, {Location: '/pages/login/login.html'})
    res.end()
})

app.get('/game', (req, res) => {
    res.writeHead(307, {Location: '/pages/game/game.html'})
    res.end()
})

loginIO.on('connection', socket => {

    socket.on('name', message => {
        let data = JSON.parse(message)

        userHandler.getUsers(users => {
            let cookies = undefined
            try {
                cookies = cookie.parse(socket.request.headers.cookie)
            } catch (e) {

            }
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
    userHandler.getUsers(users => {
        let id = cookie.parse(socket.handshake.headers.cookie).id

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
})

http.listen(port, () => {
    console.log(`Listening on http://${ip}:${port}`)
})
