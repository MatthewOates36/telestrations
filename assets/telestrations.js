const fs = require('fs')

class TelestrationsHandler {

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
        if (typeof data !== 'object') {
            data = JSON.parse(data)
        }
        this.data = {}
        for(let id of Object.keys(data)) {
            this.data[id] = new Telestration(data[id])
        }
    }

    createTelestration(id) {
        if (this.getTelestration(id) === undefined) {
            this.setTelestration(id, new Telestration())
        }
    }

    includes(id) {
        return this.getTelestration(id) !== undefined
    }

    getTelestration(id) {
        if(this.data[id] === undefined) {
            return undefined
        }
        return this.data[id]
    }

    setTelestration(id, telestration) {
        this.data[id] = telestration
    }

    clearTelestrations() {
        this.data = {}
    }

    toJSON() {
        return this.data
    }

    toString() {
        return JSON.stringify(this.data)
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
            this.data.telestration = []
            this.data.currentTelestrationState = TelestrationState.INITIAL
        }
    }

    addSection(id, type, data) {
        this.data.telestration.push({id: id, type: type, data: data})
        this.data.currentTelestrationState = TelestrationState.increment(this.data.currentTelestrationState)
    }

    getNextTelestrationSectionType() {
        return TelestrationState.sectionType(this.getCurrentTelestrationState())
    }

    getCurrentTelestrationState() {
        return this.data.currentTelestrationState
    }

    toJSON() {
        return this.data
    }

    toString() {
        return JSON.stringify(this.data)
    }

    toPrettyString() {
        return JSON.stringify(this.toJSON(), null, 2)
    }
}

const TelestrationState = {
    INITIAL: 0,
    WORD_2: 1,
    IMAGE_2: 2,
    WORD_3: 3,
    IMAGE_3: 4,
    WORD_4: 5,
    DONE: 6,
    increment: (currentState) => {
        if (currentState < this.DONE) {
            return currentState + 1
        } else {
            return this.DONE
        }
    },
    isDone: (currentState) => {
        return currentState >= TelestrationState.DONE
    },
    isWord: (currentState) => {
        return currentState === TelestrationState.WORD_2 || currentState === TelestrationState.WORD_3 || currentState === TelestrationState.WORD_4
    },
    isImage: (currentState) => {
        return currentState === TelestrationState.IMAGE_2 || currentState === TelestrationState.IMAGE_3
    },
    sectionType: (currentState) => {
        console.log(currentState)
        if(TelestrationState.isDone(currentState)) {
            return TelestrationSectionType.NONE
        }
        if(TelestrationState.isWord(currentState)) {
            return TelestrationSectionType.WORD
        }
        if(TelestrationState.isImage(currentState)) {
            return TelestrationSectionType.IMAGE
        }
        if(currentState === TelestrationState.INITIAL) {
            return TelestrationSectionType.INITIAL
        }
        return TelestrationSectionType.NONE
    }
}

const TelestrationSectionType = {
    NONE: -1,
    INITIAL: 0,
    WORD: 1,
    IMAGE: 2
}

module.exports = {
    TelestrationsHandler,
    Telestrations,
    Telestration,
    TelestrationState,
    TelestrationSectionType
}