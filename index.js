const express = require('express');

const app = express();

//init socket server

const http=require('http');
const server = http.createServer(app);
const { Server} = require('socket.io');
const io = new Server(server);

//middleware
//this will solve the error refuse to apply style from style.css....this specify use of static file....help in linking our css
app.use(express.static('public'));

//middleware for sending data from this client to server in json fromat
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//app homepage
app.get('/', (req,res)=>{
    res.sendFile(__dirname+'/public/index.html');
})

//session post page
const { v4: uuidv4 } = require('uuid');

app.post('/session',(req,res)=>{
    let data = {
        username: req.body.username,
        userID: uuidv4()
    }
    res.send(data);
})

//using middleware for connecting uuid socket.io middleware
io.use((socket, next)=>{
    const username = socket.handshake.auth.username;
    const userID = socket.handshake.auth.userID;
    if(!username){
        return next(new Error('Invalid username'));
    }
    //create new session
    socket.username = username;
    socket.id = userID;
    next();
});

//socket events
let users = [];
io.on('connection', async(socket)=>{
    //get all users
    let userData={
        username: socket.username,
        userID: socket.id
    }
    users.push(userData);
    io.emit('users', {users});

    socket.on('disconnect',()=>{
        users = users.filter(user=>user.userID !== socket.id);
        io.emit('users',{users});
    });

    //get message from client
    socket.on('message-to-server',payload => {
        io.to(payload.to).emit('message-to-user',payload);
    })
})


server.listen(3000,()=>{
    console.log('Server is running at 3000...')
})