class ScribbleArea {

    constructor(canvas) {
        this.canvas = canvas
        this.context = this.canvas[0].getContext("2d")
        this.previousCanvasStates = []
        this.stateIndex = -1
        this.pressed = false
        this.inCanvas = false
        this.drawMode = DrawMode.DRAW

        this.setDrawMode(this.drawMode)

        $(document).on("mousedown touchstart", (event) => {
            this.press(event)
        })

        $(document).on("mouseup touchend touchcancel", (event) => {
            this.release(event)
        })

        $(document).on("mousemove touchmove", (event) => {
            this.move(event)
        })
    }

    getImage() {
        return this.canvas[0].toDataURL('image/png', 1.0)
    }

    setImage(image) {
        let state = new Image()
        state.src = image

        state.onload = () => {
            this.context.drawImage(state, 0, 0)
        }
    }

    clear() {
        this.clearCanvas()
        this.resetState()
        this.saveState()
    }

    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width(), this.canvas.height())
        this.context.stroke()
    }

    setDrawMode(drawMode) {
        this.drawMode = drawMode
        if(this.drawMode === DrawMode.ERASE) {
            this.context.globalCompositeOperation = 'destination-out'
            this.context.lineWidth = 6
        } else {
            this.context.globalCompositeOperation = 'source-over'
            this.context.lineWidth = 2
        }
    }

    undo() {
        this.clearCanvas()

        this.stateIndex--

        if (this.stateIndex > -1) {
            this.setDrawMode(DrawMode.DRAW)
            this.setImage(this.previousCanvasStates[this.stateIndex])
            this.setDrawMode(this.drawMode)
        } else {
            this.stateIndex = -1
        }
    }

    redo() {
        this.stateIndex++

        if (this.stateIndex < this.previousCanvasStates.length) {
            this.clearCanvas()
            this.setDrawMode(DrawMode.DRAW)
            this.setImage(this.previousCanvasStates[this.stateIndex])
            this.setDrawMode(this.drawMode)
        } else {
            this.stateIndex = this.previousCanvasStates.length - 1
        }
    }

    press(event) {
        if(!this.getValidTouch(event)) {
           return
        }

        if (this.getMouseInCanvas(event)) {
            this.context.beginPath()

            this.resetState()

            this.pressed = true
        }
    }

    release(event) {
        if (this.pressed) {
            this.pressed = false
            this.inCanvas = false

            this.context.closePath()
            this.context.beginPath()

            this.saveState()
        }
    }

    move(event) {
        if(!this.getValidTouch(event)) {
            this.release(event)
            return
        }

        if (this.pressed) {

            let inCanvas = this.getMouseInCanvas(event)

            if (!inCanvas) {
                this.inCanvas = false
                this.context.closePath()
                return
            } else if (!this.inCanvas) {
                this.initialPosition(this.getRelativePosition(event))
                this.context.beginPath()
                this.inCanvas = true
            }

            this.updatePosition(this.getRelativePosition(event))
        }
    }

    initialPosition(position) {
        let widthScalar = this.canvas[0].width / this.canvas[0].getBoundingClientRect().width
        let heightScalar = this.canvas[0].height / this.canvas[0].getBoundingClientRect().height

        this.context.moveTo(position.x * widthScalar, position.y * heightScalar)
    }

    updatePosition(position) {
        let widthScalar = this.canvas[0].width / this.canvas[0].getBoundingClientRect().width
        let heightScalar = this.canvas[0].height / this.canvas[0].getBoundingClientRect().height

        this.context.lineTo(position.x * widthScalar, position.y * heightScalar)
        this.context.stroke()
    }

    resetState() {
        this.previousCanvasStates.splice(this.stateIndex + 1)
    }

    saveState() {
        this.previousCanvasStates.push(this.getImage())
        this.stateIndex = this.previousCanvasStates.length - 1
    }

    getMouseInCanvas(event) {
        let position = this.getRelativePosition(event)

        return position.x > 0 && position.x < this.canvas.width() && position.y > 0 && position.y < this.canvas.height()
    }

    getRelativePosition(event) {
        let offset = this.canvas.offset()
        let position = this.getPosition(event)

        let relativePosition = {}

        relativePosition.x = position.x - offset.left
        relativePosition.y = position.y - offset.top

        return relativePosition
    }

    getPosition(event) {
        let position = {}

        if (event.touches !== undefined) {
            let touchEvent = event.originalEvent.touches[0]

            position.x = touchEvent.pageX
            position.y = touchEvent.pageY
        } else {
            position.x = event.pageX
            position.y = event.pageY
        }

        return position
    }

    getValidTouch(event) {
        if (event.touches !== undefined) {
            return event.touches.length === 1
        }
        return true
    }
}

const DrawMode = {
    DRAW: 0,
    ERASE: 1
}