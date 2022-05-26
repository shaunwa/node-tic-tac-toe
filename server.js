import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

let app = express();
let server = http.createServer(app);
let io = new Server(server);

let PORT = process.env.PORT || 8080;

let playerX;
let playerO;

io.on('connection', socket => {
    if (playerX) {
        console.log('A second player has joined! Starting game...');
        playerO = socket;
        playerX.emit('info', 'A second player has joined! Time to start the game!');
        playerO.emit('info', 'You are the second player, the game will now start!');
    } else {
        console.log('The first player has joined, waiting for second player...');
        playerX = socket;
        playerX.emit('info', 'You are the first player, we are waiting for a second player to join...');
    }
});

server.listen(PORT, () => console.log('Server is listening on port ' + PORT));