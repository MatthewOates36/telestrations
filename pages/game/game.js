const socket = io('/game')
const canvas = $('#canvas')
const scribbleArea = new ScribbleArea(canvas)
const timerBar = $('#timerBar')
const timer = new Timer(timerBar)
let rating = 0

const Pages = {
    LOADING: 0,
    INITIAL: -1,
    WORD: 2,
    DRAWING: 3,
    RATING: 4,
    DISPLAY: 5
}

let drawMode = DrawMode.DRAW
let currentPage = Pages.LOADING;

let imageToGuessFromSection = $('#imageToGuessFromSection')[0]
let guessedWordSection = $('#guessedWordSection')[0]
let canvasSection = $('#canvasSection')[0]
let telestrationDisplaySection = $('#telestrationDisplaySection')[0]
let wordToBeDrawnSection = $('#wordToBeDrawnSection')[0]
let ratingSection = $('#ratingSection')[0]
let wordGuessPageDoneButton = $('#wordGuessPageDoneButton')[0]
let wordGuessInput = $('#wordGuessInput')[0]

let loadingPage = $('#loadingPage')[0]
let imageToGuessFrom = $('#imageToGuessFrom')[0]
let wordToBeDrawn = $('#wordToBeDrawn')[0]
let ratingStar1 = $('#ratingStar1')[0]
let ratingStar2 = $('#ratingStar2')[0]
let ratingStar3 = $('#ratingStar3')[0]

showLoadingPage()

ratingStar1.addEventListener('click', () => {
    setRating(1)
})
ratingStar2.addEventListener('click', () => {
    setRating(2)
})
ratingStar3.addEventListener('click', () => {
    setRating(3)
})

canvas[0].addEventListener('touchmove', e => {
    if (e.touches.length === 1) {
        e.preventDefault()
    }
}, {passive: false});

$('#clearButton').on('click touchstart', (event) => {
    event.preventDefault()
    scribbleArea.clear()
})

$('#eraseButton').on('click touchstart', (event) => {
    event.preventDefault()
    if (drawMode === DrawMode.DRAW) {
        drawMode = DrawMode.ERASE
        $('#eraseButton').html('Draw')
    } else {
        drawMode = DrawMode.DRAW
        $('#eraseButton').html('Erase')
    }
    scribbleArea.setDrawMode(drawMode)
})

$('#undoButton').on('click touchstart', (event) => {
    event.preventDefault()
    scribbleArea.undo()
})

$('#redoButton').on('click touchstart', (event) => {
    event.preventDefault()
    scribbleArea.redo()
})

$('.doneButton').each((index, item) => {
    item.addEventListener('click', continueToNextPage)
})

socket.on('redirect', message => {
    let data = JSON.parse(message)
    window.location.href = 'http://' + window.location.hostname + ':' + window.location.port + data.location
})

socket.on('loading', () => {
    showLoadingPage()
})

socket.on('initial', () => {
    showInitialPage()
})

socket.on('image', message => {
    let data = JSON.parse(message)
    imageToGuessFrom.src = data.image
    wordGuessInput.value = ''
    showWordGuessingPage()
})

socket.on('word', message => {
    let data = JSON.parse(message)
    wordToBeDrawn.innerText = 'Draw this: ' + data.word
    showDrawingPage()
    scribbleArea.reset()
})

socket.on('rate', message => {
    let data = JSON.parse(message)
    $('#telestrationWord1').text(data.word1)
    $('#telestrationImage1').attr("src", data.image1);
    $('#telestrationWord2').text(data.word2)
    $('#telestrationImage2').attr("src", data.image2);
    $('#telestrationWord3').text(data.word3)
    $('#telestrationImage3').attr("src", data.image3);
    $('#telestrationWord4').text(data.word4)
    $('#telestrationName1').text(data.name1)
    $('#telestrationName2').text(data.name2)
    $('#telestrationName3').text(data.name3)
    $('#telestrationName4').text(data.name4)
    $('#telestrationName5').text(data.name5)
    $('#telestrationName6').text(data.name6)
    $('#telestrationName7').text(data.name7)
    showPlayersTelestrationRatingPage()
})

socket.on('display', message => {
    let data = JSON.parse(message)
    $('#telestrationWord1').text(data.word1)
    $('#telestrationImage1').attr("src", data.image1);
    $('#telestrationWord2').text(data.word2)
    $('#telestrationImage2').attr("src", data.image2);
    $('#telestrationWord3').text(data.word3)
    $('#telestrationImage3').attr("src", data.image3);
    $('#telestrationWord4').text(data.word4)
    $('#telestrationName1').text(data.name1)
    $('#telestrationName2').text(data.name2)
    $('#telestrationName3').text(data.name3)
    $('#telestrationName4').text(data.name4)
    $('#telestrationName5').text(data.name5)
    $('#telestrationName6').text(data.name6)
    $('#telestrationName7').text(data.name7)
    showPlayersTelestrationDisplayPage()
})

socket.on('time', message => {
    let data = JSON.parse(message)
    timer.start(data.duration, data.offset)
})

timer.on('end', () => {
    switch(currentPage) {
        case Pages.RATING:
            if(rating < 1) {
                setRating(1)
            }
            timer.stop()
            showLoadingPage()
            socket.emit('rate', JSON.stringify({rating: rating}))
        default:
            socket.emit('dnf')
            showLoadingPage()
            break
    }
})

function continueToNextPage() {
    switch(currentPage) {
        case Pages.INITIAL:
            if(wordGuessInput.value.trim().length < 1) {
                alert('You must have a word')
                return;
            }
            if(!scribbleArea.hasDrawing()) {
                alert('You must have a drawing')
                return
            }
            timer.stop()
            showLoadingPage()
            socket.emit('initial', JSON.stringify({word: wordGuessInput.value, image: scribbleArea.getImage()}))
            break
        case Pages.WORD:
            if(wordGuessInput.value.trim().length < 1) {
                alert('You must have a word')
                return
            }
            timer.stop()
            showLoadingPage()
            socket.emit('word', JSON.stringify({word: wordGuessInput.value}))
            break
        case Pages.DRAWING:
            if(!scribbleArea.hasDrawing()) {
                alert('You must have a drawing')
                return
            }
            timer.stop()
            showLoadingPage()
            socket.emit('image', JSON.stringify({image: scribbleArea.getImage()}))
            break
        case Pages.RATING:
            if(rating < 1) {
                alert('You must rate your telestration')
            }
            timer.stop()
            showLoadingPage()
            socket.emit('rate', JSON.stringify({rating: rating}))
            break
        case Pages.DISPLAY:
            socket.emit('dnf')
            showLoadingPage()
            break
    }
}

function showInitialPage() {
    currentPage = Pages.INITIAL
    wordGuessInput.value = ''
    imageToGuessFromSection.style.display = 'none'
    guessedWordSection.style.display = 'block'
    wordToBeDrawnSection.style.display = 'none'
    canvasSection.style.display = 'block'
    telestrationDisplaySection.style.display = 'none'
    ratingSection.style.display = 'none'
    loadingPage.style.display = 'none'
    wordGuessPageDoneButton.style.display = 'none'
    wordGuessInput.placeholder = 'Choose a word to draw'
    scribbleArea.reset()
}

function showDrawingPage() {
    currentPage = Pages.DRAWING
    imageToGuessFromSection.style.display = 'none'
    guessedWordSection.style.display = 'none'
    wordToBeDrawnSection.style.display = 'block'
    canvasSection.style.display = 'block'
    telestrationDisplaySection.style.display = 'none'
    ratingSection.style.display = 'none'
    loadingPage.style.display = 'none'

}

function showWordGuessingPage() {
    currentPage = Pages.WORD
    imageToGuessFromSection.style.display = 'block'
    guessedWordSection.style.display = 'block'
    wordToBeDrawnSection.style.display = 'none'
    canvasSection.style.display = 'none'
    telestrationDisplaySection.style.display = 'none'
    ratingSection.style.display = 'none'
    loadingPage.style.display = 'none'
    wordGuessInput.placeholder = 'Guess what this is'
    wordGuessPageDoneButton.style.display = 'block'
}

function showPlayersTelestrationRatingPage() {
    currentPage = Pages.RATING
    setRating(0)
    imageToGuessFromSection.style.display = 'none'
    guessedWordSection.style.display = 'none'
    wordToBeDrawnSection.style.display = 'none'
    canvasSection.style.display = 'none'
    telestrationDisplaySection.style.display = 'inline-block'
    telestrationDisplaySection.scrollTo(0, 0)
    ratingSection.style.display = 'block'
    loadingPage.style.display = 'none'
    wordGuessPageDoneButton.style.display = 'none'
}

function showPlayersTelestrationDisplayPage() {
    currentPage = Pages.DISPLAY
    imageToGuessFromSection.style.display = 'none'
    guessedWordSection.style.display = 'none'
    wordToBeDrawnSection.style.display = 'none'
    canvasSection.style.display = 'none'
    telestrationDisplaySection.style.display = 'inline-block'
    telestrationDisplaySection.scrollTo(0, 0)
    ratingSection.style.display = 'none'
    loadingPage.style.display = 'none'
    wordGuessPageDoneButton.style.display = 'none'
}

function showLoadingPage() {
    currentPage = Pages.LOADING
    imageToGuessFromSection.style.display = 'none'
    guessedWordSection.style.display = 'none'
    wordToBeDrawnSection.style.display = 'none'
    canvasSection.style.display = 'none'
    telestrationDisplaySection.style.display = 'none'
    ratingSection.style.display = 'none'
    loadingPage.style.display = 'block'
}

function setRating(ratingStar) {
    rating = ratingStar
    switch (ratingStar) {
        case 0:
            ratingStar1.style.backgroundImage = 'url("/assets/images/empty-star.png")'
            ratingStar2.style.backgroundImage = 'url("/assets/images/empty-star.png")'
            ratingStar3.style.backgroundImage = 'url("/assets/images/empty-star.png")'
            break
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