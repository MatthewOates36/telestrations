const fs = require('fs')

class UserHandler {

    constructor(file = __dirname + '/data/users.json', options = 'utf8') {
        this.file = file
        this.options = options
    }

    getUsers(callback) {
        fs.readFile(this.file, this.options, (err, data) => {
            if (err) {
                throw err
            }
            if (callback) {
                let newData = callback(new Users(data))
                if (newData !== undefined) {
                    this.setUsers(newData)
                }
            }
        })
    }

    getUsersSync() {
        return new Users(fs.readFileSync(this.file, this.options))
    }

    setUsers(users, callback = () => {
    }) {
        if (callback !== undefined) {
            fs.writeFile(this.file, users.toPrettyString(), this.options, callback)
        }
    }

    setUsersSync(users) {
        fs.writeFileSync(this.file, users.toPrettyString(), this.options)
    }
}

class UserTracker {
    constructor(requiredCompleted = 1) {
        this.requiredCompleted = requiredCompleted
        this.users = {}
        this.pastOffsets = [0]
        this.cycleData = {}
    }

    isComplete() {
        let userIds = Object.keys(this.users)
        for(let user in userIds) {
            if (this.users[userIds[user]].completed < this.requiredCompleted) {
                return false
            }
        }

        return true
    }

    setUsers(users) {
        this.users = {}
        this.pastOffsets = [0]
        this.cycleData = {}
        for(let user of users) {
            this.users[user] = {participated: 0, completed: 0}
        }
    }

    getUsers() {
        return Object.keys(this.users)
    }

    getCurrentCycle() {
        return this.cycleData
    }

    getNextCycle() {
        let offset = this.randomOffset()
        this.pastOffsets.push(offset)
        this.cycleData = {}
        let userIds = Object.keys(this.users)
        for(let user in userIds) {
            if(this.users[userIds[user]].completed < this.requiredCompleted) {
                this.cycleData[userIds[(parseInt(user) + offset) % userIds.length]] = userIds[user]
            }
        }
        return this.cycleData
    }

    setUsersCompletedThisCycle(users) {
        for(let user of users) {
            this.users[user].participated++
            this.users[this.cycleData[user]].completed++
        }
    }

    randomOffset() {
        let num;
        let counter = 0;
        do {
            counter++
            if (counter > 1000) {
                this.pastOffsets = []
            }
            num = Math.floor(Math.random() * Object.keys(this.users).length)
        } while (this.pastOffsets.includes(num))
        return num
    }
}

class Users {

    constructor(data) {
        if (typeof data === 'object') {
            this.data = data
        } else {
            try {
                this.data = JSON.parse(data)
            } catch (e) {
                this.data = {}
            }
        }
    }

    createUser(id, name) {
        if (this.getUser(id) === undefined) {
            this.setUser(id, {id: id, name: name, connected: false})
        }
    }

    getUserID(name) {
        for(let id of Object.keys(this.data)) {
            if(this.getUserProperty(id, 'name') === name) {
                return id
            }
        }
        return undefined
    }

    includes(id) {
        return this.getUser(id) !== undefined
    }

    userConnected(id) {
        this.setUserProperty(id, "connected", true)
    }

    userDisconnected(id) {
        this.setUserProperty(id, "connected", false)
    }

    getUserProperty(id, property) {
        return this.getUser(id)[property]
    }

    setUserProperty(id, property, value) {
        let user = this.getUser(id)
        if(user === undefined) {
            console.log('User ' + id + " doesn't exist")
            return
        }
        user[property] = value
        this.getUser(user)
    }

    getUsers() {
        return this.data
    }

    getConnectedUsers() {
        let connectedUsers = {}

        for(let id of Object.keys(this.getUsers())) {
            if(this.getUserProperty(id, 'connected')) {
                connectedUsers[id] = this.getUser(id)
            }
        }

        return connectedUsers
    }

    getUser(id) {
        return this.getUsers()[id]
    }

    setUser(id, data) {
        this.data[id] = data
    }

    toJSON() {
        return this.data
    }

    toPrettyString() {
        return JSON.stringify(this.toJSON(), null, 2)
    }

    toString() {
        return JSON.stringify(this.toJSON())
    }
}

module.exports = {
    UserHandler,
    UserTracker,
    Users
}