const socket = io('/game')
const canvas = $("#canvas")
const scribbleArea = new ScribbleArea(canvas)

let drawMode = DrawMode.DRAW
let currentPage = -1;

let drawingPage = document.getElementById("drawingPage")
let wordGuessingPage = document.getElementById("wordGuessingPage")
let guessedWordInputBox = document.getElementById("wordGuessInput")
let imageToGuessFrom = document.getElementById("imageToGuessFrom")
let wordToBeDrawn = document.getElementById("wordToBeDrawn")

hideDrawingPage()

document.getElementById("doneButton").addEventListener("click", continueToNextPage)
document.getElementById("doneButtonForGuessPage").addEventListener("click", continueToNextPage)


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

socket.on('image', message =>{
    let data = JSON.parse(message)
    imageToGuessFrom.src = data.image
    hideDrawingPage()
    guessedWordInputBox.value = ""
})

socket.on('text', message =>{
    let data = JSON.parse(message)
    wordToBeDrawn.innerText = "Draw this: " + data.text
    hideWordGuessingPage()
    scribbleArea.clear()
})

function continueToNextPage(){
    currentPage = currentPage += 1
    if(currentPage % 2 === 0){
        socket.emit('text', JSON.stringify({text: guessedWordInputBox.value}))
    } else {
        socket.emit('image', JSON.stringify({image: scribbleArea.getImage()}))
    }
    console.log(guesses)
}

function hideDrawingPage() {
    drawingPage.style.display = "none"
    wordGuessingPage.style.display = "block"

}

function hideWordGuessingPage() {
    drawingPage.style.display = "block"
    wordGuessingPage.style.display = "none"
}