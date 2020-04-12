const socket = io('/game')
const canvas = $("#canvas")
const scribbleArea = new ScribbleArea(canvas)

let drawMode = DrawMode.DRAW
let currentPage = -1;

let drawingPage = document.getElementById("drawingPage")
let wordGuessingPage = document.getElementById("wordGuessingPage")
let playersTelestrationDisplayPage = document.getElementById("playersTelestrationDisplayPage")
let guessedWordInputBox = document.getElementById("wordGuessInput")
let imageToGuessFrom = document.getElementById("imageToGuessFrom")
let wordToBeDrawn = document.getElementById("wordToBeDrawn")
let ratingStar1 = document.getElementById("ratingStar1")
let ratingStar2 = document.getElementById("ratingStar2")
let ratingStar3 = document.getElementById("ratingStar3")

showWordGuessingPage()

document.getElementById("doneButton").addEventListener("click", continueToNextPage)
document.getElementById("doneButtonForGuessPage").addEventListener("click", continueToNextPage)
ratingStar1.addEventListener("click", ()=>{setRating(1)})
ratingStar2.addEventListener("click", ()=>{setRating(2)})
ratingStar3.addEventListener("click", ()=>{setRating(3)})


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
    showWordGuessingPage()
    guessedWordInputBox.value = ""
})

socket.on('text', message =>{
    let data = JSON.parse(message)
    wordToBeDrawn.innerText = "Draw this: " + data.text
    showDrawingPage()
    scribbleArea.clear()
})

function continueToNextPage(){
    currentPage = currentPage += 1
    if(currentPage === 6){
        showPlayersTelestrationDisplayPage()
    } else if(currentPage % 2 === 0){
        socket.emit('text', JSON.stringify({text: guessedWordInputBox.value}))
    } else {
        socket.emit('image', JSON.stringify({image: scribbleArea.getImage()}))
        console.log(scribbleArea.getImage())
    }
}

function showDrawingPage() {
    drawingPage.style.display = "block"
    wordGuessingPage.style.display = "none"
    playersTelestrationDisplayPage.style.display = "none"

}

function showWordGuessingPage() {
    drawingPage.style.display = "none"
    wordGuessingPage.style.display = "block"
    playersTelestrationDisplayPage.style.display = "none"
}

function showPlayersTelestrationDisplayPage() {
    drawingPage.style.display = "none"
    wordGuessingPage.style.display = "none"
    playersTelestrationDisplayPage.style.display = "block"
}

function setRating(rating) {
    switch (rating) {
        case 1:
            ratingStar1.setAttribute("style", "background-image: url(\"star.png\");" )
            ratingStar2.setAttribute("style", "background-image: url(\"empty-star.png\");" )
            ratingStar3.setAttribute("style", "background-image: url(\"empty-star.png\");" )
            break
        case 2:
            ratingStar1.setAttribute("style", "background-image: url(\"star.png\");" )
            ratingStar2.setAttribute("style", "background-image: url(\"star.png\");" )
            ratingStar3.setAttribute("style", "background-image: url(\"empty-star.png\");" )
            break
        case 3:
            ratingStar1.setAttribute("style", "background-image: url(\"star.png\");" )
            ratingStar2.setAttribute("style", "background-image: url(\"star.png\");" )
            ratingStar3.setAttribute("style", "background-image: url(\"star.png\");" )
            break
    }
}