var path = require('path');
var http  = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var moment = require('moment');

const socketio = require('socket.io');

//setting up the view engine
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended:false
}));


var users = [];

//create a server
var server = http.createServer(app);
const io = socketio(server);

//function to add the user to the users list
function addUser(id, username, room){
    var user = {id, username, room};
    users.push(user);
}

//function to return the proper format of the message
function formatMessage(username, text){
    return {
        username,
        text,
        time: moment().format('h:mm a')
    }
}

//function to get the array of users having same room
function getRoomUsers(room){
    return users.filter(user=> user.room === room);
}


//get current user info
function getCurrentUser(id){
    return users.find(user => user.id === id)
}

function userLeave(id){
    const index = users.findIndex(user => user.id === id);
    if(index != -1){
        return users.splice(index, 1)[0];
    }
}

io.on('connection', (socket)=>{
    console.log("connection done on server");

    socket.on('joinRoom', ({username, room})=>{
        addUser(socket.id, username, room);
        socket.join(room);

        //sending the message to other users of the group 
        socket.broadcast.to(room).emit('message', formatMessage('AppBot', username + "has joined the chat"));

        //welcome message in reply
        socket.emit('message', formatMessage('AppBot', 'Welcome to the chatting application'));

        //sending the users list to client side socket
        io.to(room).emit('roomUsers', {
            users: getRoomUsers(room)
        });
    })


    socket.on('newMessage', (msg)=>{
        var user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    })

    socket.on('typing', ({typing})=>{
        var user = getCurrentUser(socket.id);
        
        if(typing === true){
            socket.broadcast.to(user.room).emit('displayTyping', user.username + " is typing...");
        }
    })

    socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage('AppBot', user.username + " has left the chat"));

            //send the updated user list to client side
            io.to(user.room).emit('roomUsers', {
                users: getRoomUsers(user.room)
            });
        }
    })

});

const PORT = 3002;

app.get("/home", (req, res)=>{
    res.render('home');
});

app.post('/joinChat', (req, res)=>{
    var username = req.body.username;
    var room = req.body.room;
    res.render('chat', {username: username, room: room});
})


server.listen(PORT, ()=>{
    console.log("Listening to port", PORT);
});