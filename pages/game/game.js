const canvas = $("#canvas")
const scribbleArea = new ScribbleArea(canvas)

let drawMode = DrawMode.DRAW

canvas[0].addEventListener('touchmove', e => {
    if (e.touches.length === 1) {
        e.preventDefault()
    }
}, {passive: false});

$("#clearButton").on('click touchstart', (event) => {
    event.preventDefault()
    scribbleArea.clear()
})

$("#eraseButton").on('click touchstart', (event) => {
    event.preventDefault()
    if(drawMode === DrawMode.DRAW) {
        drawMode = DrawMode.ERASE
        $("#eraseButton").html('Draw')
    } else {
        drawMode = DrawMode.DRAW
        $("#eraseButton").html('Erase')
    }
    scribbleArea.setDrawMode(drawMode)
})

$("#undoButton").on('click touchstart', (event) => {
    event.preventDefault()
    scribbleArea.undo()
})

$("#redoButton").on('click touchstart', (event) => {
    event.preventDefault()
    scribbleArea.redo()
})

setTimeout(() => {
    let image = scribbleArea.getImage()
    console.log(image)
    $("#imageDisplay").css("background-image", "url(" + image + ")")
}, 10000)