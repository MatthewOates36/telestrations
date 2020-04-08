const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs')
const path = require('path')

// Get Server IP address
const os = require('os')
const ip = (os.networkInterfaces().en0 ? os.networkInterfaces().en0 : os.networkInterfaces().eth0).filter(address => address.family === 'IPv4')[0].address
const port = 80

// Add static pages path
app.use('/pages', express.static(path.join(__dirname, 'pages')))

// Add static assets path
app.use('/assets', express.static(path.join(__dirname, 'assets')))

app.get('/', (req, res) => {
    res.writeHead(301, {Location: '/pages/game/game.html'});
    res.end();
})

http.listen(port, () => {
    console.log(`Listening on http://${ip}:${port}`)
})