import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

let app = express();
let server = http.createServer(app);
let io = new Server(server);

let PORT = process.env.PORT || 8080;

const RUNNING = 'RUNNING';
const PLAYER_X_WINS = 'PLAYER_X_WINS';
const PLAYER_0_WINS = 'PLAYER_O_WINS';
const CATS_GAME = 'CATS_GAME';

let currentPlayer;
let gameIsOver = false;
let currentGameState = RUNNING;
let playerXMoves = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
];
let playerOMoves = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
];

let playerX;
let playerO;

io.on('connection', socket => {
    if (playerX) {
        console.log('A second player has joined! Starting game...');
        playerO = socket;
        playerX.emit('info', 'A second player has joined! Time to start the game!');
        playerO.emit('info', 'You are the second player, the game will now start!');

        startGame();
    } else {
        console.log('The first player has joined, waiting for second player...');
        playerX = socket;
        playerX.emit('info', 'You are the first player, we are waiting for a second player to join...');
    }

    socket.on('new move', input => {
        let [yMove, xMove] = parseInput(input);

        let currentPlayerMoves = currentPlayer === 'Player X'
            ? playerXMoves
            : playerOMoves;

        currentPlayerMoves[yMove][xMove] = 1;

        currentGameState = getNextGameState(playerXMoves, playerOMoves);
        gameIsOver = [PLAYER_X_WINS, PLAYER_0_WINS, CATS_GAME].includes(currentGameState);

        playerX.emit('player moves', { playerXMoves, playerOMoves });
        playerO.emit('player moves', { playerXMoves, playerOMoves });

        currentPlayer = currentPlayer === 'Player X' ? 'Player O' : 'Player X';

        if (!gameIsOver) {
            if (currentPlayer === 'Player X') {
                playerX.emit('your turn');
                playerO.emit('other player turn');
            } else {
                playerO.emit('your turn');
                playerX.emit('other player turn');
            }
        } else {
            if (currentGameState === PLAYER_X_WINS) {
                playerX.emit('win');
                playerO.emit('lose');
            } else if (currentGameState === PLAYER_0_WINS) {
                playerO.emit('win');
                playerX.emit('lose');
            } else {
                playerO.emit('tie');
                playerX.emit('tie');
            }
        }
    })
});

function startGame() {
    console.log('The game has started!');
    playerX.emit('player moves', { playerXMoves, playerOMoves });
    playerO.emit('player moves', { playerXMoves, playerOMoves });
    currentPlayer = Math.random() > 0.5 ? 'Player X' : 'Player O';

    if (currentPlayer === 'Player X') {
        playerX.emit('your turn');
        playerO.emit('other player turn');
    } else {
        playerO.emit('your turn');
        playerX.emit('other player turn');
    }
}

function parseInput(input) {
    let [letter, number] = input.split('');
    return [
        ['A', 'B', 'C'].indexOf(letter),
        ['1', '2', '3'].indexOf(number),
    ]
}

function getNextGameState(xMoves, oMoves) {
    let playerXWins = isHorizontalWin(xMoves)
        || isVerticalWin(xMoves)
        || isDiagonalWin(xMoves)
        || isCornersWin(xMoves);

    let player0Wins = isHorizontalWin(oMoves)
        || isVerticalWin(oMoves)
        || isDiagonalWin(oMoves)
        || isCornersWin(oMoves);

    if (playerXWins) {
        return PLAYER_X_WINS;
    }

    if (player0Wins) {
        return PLAYER_0_WINS;
    }

    return RUNNING;
}

function isHorizontalWin(moves) {
    return moves.some(row =>
        row.every(x => x));
}

function isVerticalWin(moves) {
    return [0, 1, 2].some(columnNumber =>
        moves.every(row => row[columnNumber]));
}

function isDiagonalWin(moves) {
    return (moves[0][0] && moves[1][1] && moves[2][2])
        || (moves[0][2] && moves[1][1] && moves[2][0]);
}

function isCornersWin(moves) {
    return moves[0][0] && moves[0][2]
        && moves[2][0] && moves[2][2];
}


server.listen(PORT, () => console.log('Server is listening on port ' + PORT));