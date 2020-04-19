class Timer extends EventHandler {

    constructor(timerElement) {
        super();

        this.timerElement = timerElement
        this.visible = false
        this.duration = 0
        this.offset = 0
        this.startTime = 0

        $(document).on('focus', () => {
            this.update()
        })
    }

    start(duration, offset = 0) {
        clearTimeout(this.timeout)
        this.setStartTime(this.getTime())
        this.setDuration(duration)
        this.setOffset(offset)
        this.display(true)
        this.reset()
        this.timeout = setTimeout(() => {
            this.dispatch('end')
        }, duration - offset)
        this.dispatch('start', {duration: duration, offset: offset})
    }

    update() {
        this.setOffset(this.offset + this.getTime() - this.startTime)
        this.reset()
    }

    stop() {
        clearTimeout(this.timeout)
        this.display(false)
        this.dispatch('stop')
    }

    reset() {
        let animationName = this.timerElement.css('animation-name')
        let animationTimingFunction = this.timerElement.css('animation-timing-function')
        let animationDuration = this.timerElement.css('animation-duration')
        let animationDelay = this.timerElement.css('animation-delay')
        this.timerElement.css('animation', 'none')
        this.timerElement.height()
        this.timerElement.css('animation-name', animationName)
        this.timerElement.css('animation-duration', animationDuration)
        this.timerElement.css('animation-timing-function', animationTimingFunction)
        this.timerElement.css('animation-delay', animationDelay)
    }

    setStartTime(time) {
        this.startTime = time
    }

    setDuration(period) {
        this.timerElement.css('animation-duration', period + 'ms')
    }

    setOffset(offset) {
        this.timerElement.css('animation-delay', '-' + offset + 'ms')
    }

    getTime() {
        return new Date().getTime()
    }

    display(visible) {
        if(visible) {
            this.timerElement.css('display', 'block')
        } else {
            this.timerElement.css('display', 'none')
        }
        this.visible = visible
    }
}