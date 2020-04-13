const fs = require('fs')

class TelestrationsHandler{

    constructor(file = __dirname + '/data/gamedata.json', options = 'utf8') {
        this.file = file
        this.options = options
    }

    getTelestraions(callback) {
        fs.readFile(this.file, this.options, (err, data) => {
            if (err) {
                throw err
            }
            if (callback) {
                let newData = callback(new Telestrations(data))
                if (newData !== undefined) {
                    this.setTelestrations(newData)
                }
            }
        })
    }

    setTelestrations(users, callback = () => {
    }) {
        if (callback !== undefined) {
            fs.writeFile(this.file, users.toPrettyString(), this.options, callback)
        }
    }
}

class Telestrations {

    constructor(data) {
        if (typeof data === 'object') {
            this.data = data
        } else {
            this.data = JSON.parse(data)
        }
    }

    createTelestration(id, name) {
        if (this.getTelestration(id) === undefined) {
            this.setTelestration(id, {id: id, name: name, connected: false})
        }
    }

    includes(id) {
        return this.getTelestration(id) !== undefined
    }

    getTelestration(id) {
        return this.data[id]
    }

    setTelestration(id, data) {
        this.data[id] = data
    }

    toPrettyString() {
        return JSON.stringify(this.toJSON(), null, 2)
    }
}

class Telestration {

    constructor(data) {
        if (typeof data === 'object') {
            this.data = data
        } else if (data !== undefined) {
            this.data = JSON.parse(data)
        } else {
            this.data = {}
            this.data.words = []
            this.data.images = []
        }
    }

    addWord(word){
        this.data.words.push(word)
    }

    addImage(image){
        this.data.images.push(image)
    }

    toJSON(data){
        return data
    }

    toString(data){
        return JSON.stringify(data)
    }

    toPrettyString(){
        return JSON.stringify(this.toJSON(), null, 2)
    }

}