var express = require('express');
var app = express();
var server = require('http').createServer(app);
server.listen(process.env.PORT||3000);
console.log("Server running...");
var io = require('socket.io').listen(server);
let users = [];
let connections = [];

// app.get('/',function(req,res){
//     res.sendFile(__dirname+"/index.html");
// });
// app.use(express.static(__dirname + '/'));


io.sockets.on('connection',function(socket){

    connections.push(socket);
    console.log('Connected: %s sockets connected',connections.length);
    //disconnect
    socket.on('disconnect',function(){
        if(!socket.username) return;
        users.splice(users.indexOf(socket.username),1);
        updateUserNames();
        connections.splice(connections.indexOf(socket),1);
        console.log('Disconnected: %s sockets connected',connections.length);
    }); 
    socket.on('send_message',function(data){
        console.log(data);
        io.sockets.emit('new_message',{message:data});
    });
    //new user
    socket.on('join',function(data,callback){
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUserNames();
    });
    
    function updateUserNames(){
        io.sockets.emit('new_user',users);
    }

});
