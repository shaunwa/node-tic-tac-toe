import socketIoClient from 'socket.io-client';
import * as readline from 'node:readline/promises';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let serverUrl = process.env.IS_DEV
    ? 'http://127.0.0.1:8080'
    : 'https://node-tic-tac-toe-shaun.herokuapp.com' 

let socket = socketIoClient(serverUrl);

socket.on('player moves', ({ playerXMoves, playerOMoves }) => {
    drawGrid(playerXMoves, playerOMoves);
});

socket.on('your turn', async () => {
    let inputValid = false;
    let response;

    while (!inputValid) {
        response = await rl.question('It\'s your turn! Please enter your next move: ');
        inputValid = isValidInput(response);
        if (!inputValid) {
            console.log('Invalid input, please enter a capital letter followed by a number.');
        }
    }

    socket.emit('new move', response);
});

socket.on('other player turn', () => {
    console.log('Waiting for the other player\'s input...');
});

socket.on('info', message => {
    console.log(message);
});

socket.on('win', () => {
    console.log('The game is over! You won!!');
    rl.close();
    socket.disconnect();
});

socket.on('lose', () => {
    console.log('The game is over! You lost!!');
    rl.close();
    socket.disconnect();
});

socket.on('tie', () => {
    console.log('The game is over! It\'s a tie!!');
    rl.close();
    socket.disconnect();
});

function isValidInput(input) {
    let [letter, number] = input.split('');
    return ['A', 'B', 'C'].includes(letter) && ['1', '2', '3'].includes(number);
}

function drawGrid(xMoves, oMoves) {
    console.log();
    drawNumberLabels(),
    drawVerticalLines(xMoves[0], oMoves[0], 'A');
    drawHorizontalLine();
    drawVerticalLines(xMoves[1], oMoves[1], 'B');
    drawHorizontalLine();
    drawVerticalLines(xMoves[2], oMoves[2], 'C');
    console.log();
}

function drawNumberLabels() {
    console.log('   1   2   3  ');
}

function drawVerticalLines(xMoves, oMoves, label) {
    let space1Char = xMoves[0] ? 'X' : oMoves[0] ? 'O' : ' ';
    let space2Char = xMoves[1] ? 'X' : oMoves[1] ? 'O' : ' ';
    let space3Char = xMoves[2] ? 'X' : oMoves[2] ? 'O' : ' ';

    console.log(`${label}  ${space1Char} | ${space2Char} | ${space3Char} `);
}

function drawHorizontalLine() {
    console.log('  ---+---+---');
}