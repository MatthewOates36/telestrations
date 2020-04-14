const socket = io('/game')
const canvas = $("#canvas")
const scribbleArea = new ScribbleArea(canvas)

let drawMode = DrawMode.DRAW
let currentPage = -1;

let imageToGuessFromSection = document.getElementById("imageToGuessFromSection")
let guessedWordSection = document.getElementById("guessedWordSection")
let canvasSection = document.getElementById("canvasSection")
let telestrationDisplaySection = document.getElementById("telestrationDisplaySection")
let wordToBeDrawnSection = document.getElementById("wordToBeDrawnSection")
let ratingSection = document.getElementById("ratingSection")
let wordGuessPageDoneButton = document.getElementById("wordGuessPageDoneButton")
let wordGuessInput = document.getElementById("wordGuessInput")

let loadingPage = document.getElementById("loadingPage")
let guessedWordInputBox = document.getElementById("wordGuessInput")
let imageToGuessFrom = document.getElementById("imageToGuessFrom")
let wordToBeDrawn = document.getElementById("wordToBeDrawn")
let ratingStar1 = document.getElementById("ratingStar1")
let ratingStar2 = document.getElementById("ratingStar2")
let ratingStar3 = document.getElementById("ratingStar3")

showInitialPage()

$('.doneButton').each((index, item) => {
    console.log(item)
    item.addEventListener("click", continueToNextPage)
})

ratingStar1.addEventListener("click", () => {
    setRating(1)
})
ratingStar2.addEventListener("click", () => {
    setRating(2)
})
ratingStar3.addEventListener("click", () => {
    setRating(3)
})

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
    if (drawMode === DrawMode.DRAW) {
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

socket.on('redirect', message => {
    let data = JSON.parse(message)
    window.location.href = "http://" + window.location.hostname + ":" + window.location.port + data.location
})

socket.on('enter-initial', () => {
    showInitial()
})

socket.on('image', message => {
    let data = JSON.parse(message)
    imageToGuessFrom.src = data.image
    showWordGuessingPage()
    guessedWordInputBox.value = ""
})

socket.on('text', message => {
    let data = JSON.parse(message)
    wordToBeDrawn.innerText = "Draw this: " + data.text
    showDrawingPage()
    scribbleArea.clear()
})

function continueToNextPage() {
    currentPage = currentPage += 1
    if (currentPage === 6) {
        showPlayersTelestrationDisplayPage()
    } else if (currentPage % 2 === 0) {
        socket.emit('text', JSON.stringify({text: guessedWordInputBox.value}))
    } else {
        socket.emit('image', JSON.stringify({image: scribbleArea.getImage()}))
        console.log(scribbleArea.getImage())
    }
}

function showInitialPage(){
    imageToGuessFromSection.style.display = "none"
    guessedWordSection.style.display = "block"
    wordToBeDrawnSection.style.display = "none"
    canvasSection.style.display = "block"
    telestrationDisplaySection.style.display = "none"
    ratingSection.style.display = "none"
    loadingPage.style.display = "none"
    wordGuessPageDoneButton.style.display = "none"
    wordGuessInput.placeholder = "Choose a word to draw"

}

function showDrawingPage() {
    imageToGuessFromSection.style.display = "none"
    guessedWordSection.style.display = "none"
    wordToBeDrawnSection.style.display = "block"
    canvasSection.style.display = "block"
    telestrationDisplaySection.style.display = "none"
    ratingSection.style.display = "none"
    loadingPage.style.display = "none"

}

function showWordGuessingPage() {
    imageToGuessFromSection.style.display = "block"
    guessedWordSection.style.display = "block"
    wordToBeDrawnSection.style.display = "none"
    canvasSection.style.display = "none"
    telestrationDisplaySection.style.display = "none"
    ratingSection.style.display = "none"
    loadingPage.style.display = "none"
    wordGuessInput.placeholder = "Guess what this is"
    wordGuessPageDoneButton.style.display = "block"
}

function showPlayersTelestrationDisplayPage() {
    imageToGuessFromSection.style.display = "none"
    guessedWordSection.style.display = "none"
    wordToBeDrawnSection.style.display = "none"
    canvasSection.style.display = "none"
    telestrationDisplaySection.style.display = "block"
    ratingSection.style.display = "block"
    loadingPage.style.display = "none"
}

function showLoadingPage() {
    imageToGuessFromSection.style.display = "none"
    guessedWordSection.style.display = "none"
    wordToBeDrawnSection.style.display = "none"
    canvasSection.style.display = "none"
    telestrationDisplaySection.style.display = "none"
    ratingSection.style.display = "none"
    loadingPage.style.display = "block"
}

function setRating(rating) {
    switch (rating) {
        case 1:
            ratingStar1.style.backgroundImage = 'url("/assets/images/star.png")'
            ratingStar2.style.backgroundImage = 'url("/assets/images/empty-star.png")'
            ratingStar3.style.backgroundImage = 'url("/assets/images/empty-star.png")'
            break
        case 2:
            ratingStar1.style.backgroundImage = 'url("/assets/images/star.png")'
            ratingStar2.style.backgroundImage = 'url("/assets/images/star.png")'
            ratingStar3.style.backgroundImage = 'url("/assets/images/empty-star.png")'
            break
        case 3:
            ratingStar1.style.backgroundImage = 'url("/assets/images/star.png")'
            ratingStar2.style.backgroundImage = 'url("/assets/images/star.png")'
            ratingStar3.style.backgroundImage = 'url("/assets/images/star.png")'
            break
    }
}