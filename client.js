#!/usr/bin/env node

import socketIoClient from 'socket.io-client';
import * as readline from 'node:readline/promises';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let serverUrl = process.env.IS_DEV
    ? 'http://127.0.0.1:8080'
    : 'https://node-tic-tac-toe-shaun.herokuapp.com' 

let hasId = await rl.question('Do you have an id of a game you want to join? (Y/N) ');

let socket;

if (hasId.toUpperCase() === 'Y') {
    let id = await rl.question('Okay, great! Please enter the id of the game you wish to join: ');
    socket = socketIoClient(serverUrl, {
        query: { gameId: id }
    });
} else {
    let wantsToCreateNewGame = await rl.question('Okay, no problem! Do you want to create a new game with an id? (Y/N) ');
    if (wantsToCreateNewGame.toUpperCase() === 'Y') {
        socket = socketIoClient(serverUrl, {
            query: { createNew: true }
        });
    } else {
        socket = socketIoClient(serverUrl);
    }
}

socket.on('player moves', ({ playerXMoves, playerOMoves }) => {
    drawGrid(playerXMoves, playerOMoves);
});

async function getNextMove(prompt) {
    let inputValid = false;
    let response;

    while (!inputValid) {
        response = await rl.question(prompt);
        inputValid = isValidInput(response);
        if (!inputValid) {
            console.log('Invalid input, please enter a capital letter followed by a number.');
        }
    }

    socket.emit('new move', response);
}

socket.on('id not found', () => {
    console.log('A game with that id was not found! Please try again');
    socket.disconnect();
    rl.close();
})

socket.on('position taken', () => {
    console.log('Sorry, that position is taken.');
    getNextMove('Please enter a new (empty) position: ');
})

socket.on('your turn', () => {
    getNextMove('Please enter your next move: ');
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