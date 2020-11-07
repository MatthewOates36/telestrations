const express = require('express')
const app = express()
const http = require('http').createServer(app)

const { Worker } = require('worker_threads')
const path = require('path')

const IP = require('ip').address()

const NUM_INSTANCES = 7
const BASE_PORT = 5000

for (let i = 0; i < NUM_INSTANCES; i++) {
    new Worker('./server.js', { workerData: { port: BASE_PORT + i } })
}

// Add static manager path
app.use('/manager', express.static(path.join(__dirname, 'pages/manager')))

app.get('/manager', (_, res) => {
    res.writeHead(307, {Location: '/manager/manager.html'})
    res.end()
})

app.get('/api/getInstancesData', (_, res) => {
    res.json({
        NUM_INSTANCES, BASE_PORT, IP
    })
})

http.listen(BASE_PORT - 1, () => {
    console.log(`Manager listening on http://${IP}:${BASE_PORT - 1}`)
})
