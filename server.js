import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

let app = express();
let server = http.createServer(app);
let io = new Server(server);

let PORT = process.env.PORT || 8080;

const WAITING = 'WAITING';
const RUNNING = 'RUNNING';
const PLAYER_X_WINS = 'PLAYER_X_WINS';
const PLAYER_0_WINS = 'PLAYER_O_WINS';
const CATS_GAME = 'CATS_GAME';

let games = [];

function createNewGame() {
    return {
        currentPlayer: null,
        gameIsOver: false,
        currentGameState: WAITING,
        playerXMoves: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        playerOMoves: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ],
        playerXSocket: null,
        playerOSocket: null,
    }
}

let nextSocketId = 0;

io.on('connection', socket => {
    let socketId = nextSocketId;
    nextSocketId += 1;

    let waitingGame = games.find(game => game.currentGameState === WAITING);
    let game;

    if (waitingGame) {
        game = waitingGame;
        console.log('A second player has joined! Starting game...');
        game.playerOSocket = socket;
        game.playerXSocket.emit('info', `A second player has joined! You\'re playing against ${socketId}. Time to start the game!`);
        game.playerOSocket.emit('info', `You are the second player, your id is ${socketId}, and you are playing against ${game.playerXId}. The game will now start!`);
        game.playerOId = socketId;

        startGame(waitingGame);
    } else {
        let newGame = createNewGame();
        game = newGame;
        console.log('The first player has joined, waiting for second player...');
        game.playerXSocket = socket;
        game.playerXSocket.emit('info', `You are the first player,and your id is ${socketId}. We are waiting for a second player to join...`);
        game.playerXId = socketId;
        games.push(game);
    }

    socket.on('new move', input => {
        let {
            playerXMoves,
            playerOMoves,
            playerXSocket,
            playerOSocket,
        } = game;

        let [yMove, xMove] = parseInput(input);

        let currentPlayerMoves = game.currentPlayer === 'Player X'
            ? playerXMoves
            : playerOMoves;

        currentPlayerMoves[yMove][xMove] = 1;

        game.currentGameState = getNextGameState(playerXMoves, playerOMoves);
        game.gameIsOver = [PLAYER_X_WINS, PLAYER_0_WINS, CATS_GAME].includes(game.currentGameState);

        playerXSocket.emit('player moves', { playerXMoves, playerOMoves });
        playerOSocket.emit('player moves', { playerXMoves, playerOMoves });

        game.currentPlayer = game.currentPlayer === 'Player X' ? 'Player O' : 'Player X';

        if (!game.gameIsOver) {
            if (game.currentPlayer === 'Player X') {
                playerXSocket.emit('your turn');
                playerOSocket.emit('other player turn');
            } else {
                playerOSocket.emit('your turn');
                playerXSocket.emit('other player turn');
            }
        } else {
            if (game.currentGameState === PLAYER_X_WINS) {
                playerXSocket.emit('win');
                playerOSocket.emit('lose');
            } else if (game.currentGameState === PLAYER_0_WINS) {
                playerOSocket.emit('win');
                playerXSocket.emit('lose');
            } else if (game.currentGameState === CATS_GAME) {
                playerOSocket.emit('tie');
                playerXSocket.emit('tie');
            }

            games = games.filter(g => g !== game);
        }
    })
});

function startGame(game) {
    let {
        playerXSocket,
        playerOSocket,
        playerXMoves,
        playerOMoves,
    } = game;

    game.currentGameState = RUNNING;

    console.log('The game has started!');
    playerXSocket.emit('player moves', { playerXMoves, playerOMoves });
    playerOSocket.emit('player moves', { playerXMoves, playerOMoves });
    game.currentPlayer = Math.random() > 0.5 ? 'Player X' : 'Player O';

    if (game.currentPlayer === 'Player X') {
        playerXSocket.emit('your turn');
        playerOSocket.emit('other player turn');
    } else {
        playerOSocket.emit('your turn');
        playerXSocket.emit('other player turn');
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

    if (playerXWins) {
        return PLAYER_X_WINS;
    }

    let player0Wins = isHorizontalWin(oMoves)
        || isVerticalWin(oMoves)
        || isDiagonalWin(oMoves)
        || isCornersWin(oMoves);

    if (player0Wins) {
        return PLAYER_0_WINS;
    }

    let catsGame = isCatsGame(xMoves, oMoves);

    if (catsGame) {
        return CATS_GAME;
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

function isCatsGame(xMoves, oMoves) {
    return xMoves.every((row, rowNumber) =>
        row.every((_, columnNumber) =>
            xMoves[rowNumber][columnNumber]
                || oMoves[rowNumber][columnNumber]))
}

server.listen(PORT, () => console.log('Server is listening on port ' + PORT));