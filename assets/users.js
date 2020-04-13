const fs = require('fs')

class UserHandler {

    constructor(file = __dirname + '/data/users.json', options = 'utf8') {
        this.file = file
        this.options = options
    }

    getUsers(callback) {
        fs.readFile(this.file, this.options, (err, data) => {
            if(err) {
                throw err
            }
            if(callback) {
                let newData = callback(new Users(data))
                if(newData !== undefined) {
                    this.setUsers(newData)
                }
            }
        })
    }

    getUsersSync() {
        return new Users(fs.readFileSync(this.file, this.options))
    }

    setUsers(users, callback = () => {}) {
        if(callback !== undefined) {
            fs.writeFile(this.file, users.toString(), this.options, callback)
        }
    }

    setUsersSync(users) {
        fs.writeFileSync(this.file, users.toString(), this.options)
    }
}

class Users {

    constructor(data) {
        if(typeof data === 'object') {
            this.data = data
        } else {
            this.data = JSON.parse(data)
        }
    }

    createUser(id, name) {
        if(this.getUser(id) === undefined) {
            this.setUser(id, {id: id, name: name, connected: false})
        }
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
        user[property] = value
        this.getUser(user)
    }

    getUser(id) {
        return this.data[id]
    }

    setUser(id, data) {
        this.data[id] = data
    }

    toJSON() {
        return this.data
    }

    toString() {
        return JSON.stringify(this.toJSON())
    }
}

module.exports = {
    UserHandler,
    Users
}