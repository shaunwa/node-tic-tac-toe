import readline from 'readline';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function displayPrompt(string) {
    return new Promise(resolve => {
        rl.question(string, resolve);
    })
}

let gameIsOver = false;
let currentPlayer = 'Player X';
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

const RUNNING = 'RUNNING';
const PLAYER_X_WINS = 'PLAYER_X_WINS';
const PLAYER_0_WINS = 'PLAYER_O_WINS';
const CATS_GAME = 'CATS_GAME';

async function startGame() {
    let currentGameState = RUNNING;

    console.log();
    drawGrid(playerXMoves, playerOMoves);
    console.log();

    while (!gameIsOver) {
        let response = await displayPrompt(`${currentPlayer}, please enter your next move: `);

        if (isValidInput(response)) {
            let [yMove, xMove] = parseInput(response);

            let currentPlayerMoves = currentPlayer === 'Player X'
                ? playerXMoves
                : playerOMoves;

            currentPlayerMoves[yMove][xMove] = 1;

            currentPlayer = currentPlayer === 'Player X' ? 'Player O' : 'Player X';

            currentGameState = getNextGameState(playerXMoves, playerOMoves);
            gameIsOver = [PLAYER_X_WINS, PLAYER_0_WINS, CATS_GAME].includes(currentGameState);

            console.log();
            drawGrid(playerXMoves, playerOMoves);
            console.log();
        } else {
            console.log('Not a valid input string! Please enter a capital letter followed by a number (i.e. A1, B2, etc.)');
        }
    }

    if (currentGameState === PLAYER_X_WINS) {
        console.log('Player X is the winner!');
    }

    if (currentGameState === PLAYER_0_WINS) {
        console.log('Player O is the winner!');
    }

    if (currentGameState === CATS_GAME) {
        console.log('It\'s a tie!');
    }

    rl.close();
}

function isValidInput(input) {
    let [letter, number] = input.split('');
    return ['A', 'B', 'C'].includes(letter) && ['1', '2', '3'].includes(number);
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

function drawGrid(xMoves, oMoves) {
    drawNumberLabels(),
    drawVerticalLines(xMoves[0], oMoves[0], 'A');
    drawHorizontalLine();
    drawVerticalLines(xMoves[1], oMoves[1], 'B');
    drawHorizontalLine();
    drawVerticalLines(xMoves[2], oMoves[2], 'C');
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

startGame();