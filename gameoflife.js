/**
 * Sleep for `n` milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * A range of numbers in the domain of `[lowerBound, upperBound)`
 * `lowerBound == null` represents `-Infinity`
 * `upperBound == null` represents `+Infinity`
 */
class Range {
    constructor(lowerBound, upperBound) {
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
    }

    /**
     * Returns whether `num` is in the `Range`
     */
    inRange(num) {
        const lowerBoundCheck = this.lowerBound === null || this.lowerBound <= num;
        const upperBoundCheck = this.upperBound === null || num < this.upperBound;
        return lowerBoundCheck && upperBoundCheck;
    }
}

/**
 * The set of rules which determine how a cell should propogate
 */
class GameRules {
    constructor(
        populate = new Range(2, 4),
        reproduce = new Range(3, 4)
    ) {
        // Cell dies if outside this Range
        this.populate = populate;
        // Cell comes back to life if it has numNeighbors in this Range
        this.reproduce = reproduce;
    }

    /**
     * Given whether a cell is currently alive and how many neighors it makes,
     * returns whether it should be alive in the next game state
     */
    shouldLive(isCurrentlyAlive, numNeighbors) {
        if (isCurrentlyAlive) {
            return this.populate.inRange(numNeighbors);
        }
        return this.reproduce.inRange(numNeighbors);
    }
}

class Game {
    constructor(initHeight, initWidth, initDensity, rules = new GameRules()) {
        this.rules = rules;
        this.board = new Set();
        // randomly filling in the board with alive and dead cells
        // `true` represents an alive cell
        // `false` represents a dead cell
        for (let i = 0; i < initHeight; ++i) {
            for (let j = 0; j < initWidth; ++j) {
                if (Math.random() < initDensity) {
                    this.board.add(i + "," + j);
                }
            }
        }
        this.minHeight = 0;
        this.minWidth = 0;
        this.maxHeight = initHeight;
        this.maxWidth = initWidth;
    }

    /**
     * String representation of the board
     */
    toString() {
        let board = "";
        for (let i = this.minHeight; i < this.maxHeight; ++i) {
            for (let j = this.minWidth; j < this.maxWidth; ++j) {
                board += this.board.has(i + "," + j) ? "X" : " ";
            }
            board += "\n";
        }
        return board;
    }

    /**
     * Update the game board to the next state
     */
    nextState() {
        /**
         * Let `table[minHeight - 1 .. maxHeight][minWidth - 1 .. maxWidth]`,
         * where `table[row][col] == this.board.has(row + "," + col)`,
         * then `countNeighbors(row, col)` == number of live cells neighboring `table[row][col]`
         */
        const countNeighbors = (row, col) => {
            let neighborCount = 0;
            for (let i = row - 1; i <= row + 1; ++i) {
                for (let j = col - 1; j <= col + 1; ++j) {
                    if (!(i == row && j == col)) {
                        neighborCount += this.board.has(i + "," + j);
                    }
                }
            }
            return neighborCount;
        }

        let newBoard = new Set();
        let newMinHeight = this.minHeight;
        let newMinWidth = this.minWidth;
        let newMaxHeight = this.maxHeight;
        let newMaxWidth = this.maxWidth;
        for (let row = this.minHeight - 1; row <= this.maxHeight; ++row) {
            for (let col = this.minWidth - 1; col <= this.maxWidth; ++col) {
                let numNeighbors = countNeighbors(row, col);
                let isAlive = this.board.has(row + "," + col);
                let shouldLive = this.rules.shouldLive(isAlive, numNeighbors);
                if (shouldLive) {
                    newBoard.add(row + "," + col);
                    if (row < this.minHeight) {
                        newMinHeight = row;
                    } else if (row == this.maxHeight) {
                        newMaxHeight = row + 1;
                    }
                    if (col < this.minWidth) {
                        newMinWidth = col;
                    } else if (col == this.maxWidth) {
                        newMaxWidth = col + 1;
                    }
                }
            }
        }

        this.board = newBoard;
        this.minHeight = newMinHeight;
        this.minWidth = newMinWidth;
        this.maxHeight = newMaxHeight;
        this.maxWidth = newMaxWidth;
    }

    async playGame(delay) {
        while (true) {
            document.getElementById("gameSpace").textContent = this.toString();
            await sleep(delay);
            this.nextState();
        }
    }
}

window.addEventListener("load", () => {
    g = new Game(100, 100, 0.5);
    g.playGame(500);
})
