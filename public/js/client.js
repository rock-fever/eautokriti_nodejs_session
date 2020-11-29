var socket = io();

socket.on('connect', ()=>{
    console.log('client side connection is done');
});

socket.on('hello', (msg)=>{
    console.log(msg);
});

socket.on('roomUsers', ({users})=>{
    console.log(users);
    showUsers(users);
})

socket.on('message', (msg)=>{
    showMessage(msg);
});

socket.on('displayTyping', (msg)=>{
    console.log(msg);
    document.querySelector('.someone_typing').innerHTML = msg;
    setTimeout(()=>{
        document.querySelector('.someone_typing').innerHTML = "";
    }, 500);
})

function emitUserInfo(){
   var room = document.querySelector('.user_room').textContent.split(':')[1].trim();
   var username = document.querySelector('.username').textContent.split(':')[1].trim();
   socket.emit('joinRoom', {username, room});
}

function showMessage(msg){
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = "<p class='msg_info'><span class='msg_username'>" + msg.username + "</span>&nbsp;<span class='msg_time'>"+msg.time+"</span><p> " + msg.text + "</p>";
    document.querySelector('.chat_container').appendChild(div);
}


function showUsers(users){
    var html = "";
    users.forEach(element => {
        html += "<li>" + element.username + "</li>";
    });
    
    document.querySelector('.users_list').innerHTML = html;
}

function sendTyping(){
    console.log("typing..");
    socket.emit('typing', {typing:true});
}

document.getElementById('chatForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    var msg = e.target.elements.msg.value;
    socket.emit('newMessage', msg);
    e.target.elements.msg.value = "";
});