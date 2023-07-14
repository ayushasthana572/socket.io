const socket = io('http://localhost:3000/',{
    autoConnect: false
});
//global variable
const chatBody =  document.querySelector('.chat-body');
const userTitle = document.getElementById('user-title');
const loginContainer =  document.querySelector('.login-container');
let userTable = document.querySelector('.users');
const userTagline = document.querySelector('#users-tagline');
const title = document.querySelector('#active-user');
const messages = document.querySelector('.messages');
const msgDiv = document.querySelector('.msg-form');

//global variable
const methods = {
    socketConnect: async(username,userID)=>{
        socket.auth = {username, userID }
        await socket.connect();
    },
    createSession: async(username)=>{
        const data ={
            username
        }
        let options ={
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }
        await fetch('/session', options)
        .then(res=>res.json() )
        .then(data =>{
            // console.log(data)
            //creating new user
            methods.socketConnect(data.username,data.userID);
            //set local storage for session
            localStorage.setItem('session-username',data.username);
            localStorage.setItem('session-userID',data.userID);
            loginContainer.classList.add('d-none');
            chatBody.classList.remove('d-none');
    
            userTitle.innerHTML = data.username;
        })
        .catch(err=> console.log(err))
    },
    setActiveUser : (username, userID) =>{
        title.innerHTML=username;

        title.setAttribute('userID',userID);
        //user list active and inactive class event handler

        const list = document.getElementsByClassName('socket-users');
        for(let i=0;i<list.length;i++){
            list[i].classList.remove('table-active');
        }
        event.currentTarget.classList.add('table-active');

        //display message area after selecting user
        msgDiv.classList.remove('d-none');
        messages.innerHTML='';

    },
    appendMessage: ({message,time,background,position})=>{
        let div = document.createElement('div');
        div.classList.add('message','bg-opacity-25','rounded','m-2','px-2','py-1',background,position);
        div.innerHTML=`<span class=msg-text">${message}</span><span class="msg-time">${time}</span>`;
        messages.append(div);
        messages.scrollTo(0,messages.scrollHeight);
    }
}

//session variable
const sessUsername = localStorage.getItem('session-username');
const sessUserId = localStorage.getItem('session-userID');

if(sessUsername && sessUserId){
    methods.socketConnect(sessUsername,sessUserId);
    loginContainer.classList.add('d-none');
    chatBody.classList.remove('d-none');
    userTitle.innerHTML = sessUsername;

}
//selecting login form
const loginForm = document.querySelector('.user-login');

loginForm.addEventListener('submit' , (e)=>{
    // prevent submiting form
    e.preventDefault();
    const username = document.getElementById('username');
    methods.createSession(username.value.toLowerCase());
    username.value = '';
});

//user list table
socket.on('users',({users})=>{
    // console.log(users);
    //removing self user
    const index = users.findIndex( user => user.userID === socket.id);
    if(index > -1){
        users.splice(index, 1);
    }

    //generating user table list
    //pagereload pr table empty ho jayegi
    userTable.innerHTML = '';
    let ul = `<table class="table table-hover">`;
    for (const user of users) {
        ul += `<tr class="socket-users" onclick="methods.setActiveUser('${user.username}','${user.userID}')"><td>${user.username}</td></tr>`;
    }
    ul+=`</table`;
    if(users.length > 0){
        userTable.innerHTML=ul;
        userTagline.innerHTML="Online Users";
        userTagline.classList.add('text-success');
        userTagline.classList.remove('text-danger');
     } 
     else{
            userTagline.innerHTML="No active user";
            userTagline.classList.remove(`text-success`);
            userTagline.classList.add('text-danger');
        }
})

//chat form handler

const msgForm= document.querySelector('.msg-form');
const message = document.getElementById('message');
msgForm.addEventListener('submit', e => {
    e.preventDefault();
    const to = title.getAttribute('userID');
    let time = new Date().toLocaleString('en-US',{
        hour:'numeric',
        minute:'numeric',
        hour12: true
    });

    //set new message payload
    let payload={
        from:socket.id,
        to,
        message:message.value,
        time
    }
    //emit message to server
    socket.emit('message-to-server',payload);

    methods.appendMessage({...payload, background:'bg-success',position:'right'});

    message.value='';
    message.focus();
});

//receive private message
socket.on('message-to-user',({message,time} )=>{
    methods.appendMessage({message,time,background:'bg-secondary',position:'left'});
})

