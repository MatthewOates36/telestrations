class EventHandler {
    constructor() {
        this.listeners = []
    }

    on(type, listener) {
        this.listeners.push({types: type.split(' '), listener: listener})
    }

    off(type) {
        for(let listener of this.listeners) {
            for(let t of listener.types) {
                if(t === type) {
                    listener.types.splice(listener.types.indexOf(t), 1)
                }
            }

            if(listener.types.length < 1) {
                this.listeners.splice(this.listeners.indexOf(listener), 1)
            }
        }
    }

    dispatch(type, event) {
        for(let listener of this.listeners) {
            for(let t of listener.types) {
                if(t === type) {
                    listener.listener(event)
                }
            }
        }
    }
}