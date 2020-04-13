let socket = io('/login')

socket.on('id', message => {
    let data = JSON.parse(message)
    document.cookie = `id=${data.id};path=/`
    window.location.href = "http://" + window.location.hostname + ":" + window.location.port + "/game"
})

function submit() {
    socket.emit('name', JSON.stringify({name: document.getElementById("name").value}))
}