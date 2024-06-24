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
    fastNextState() {
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

        const updateBoardBoundaries = (row, col) => {
            if (row < this.minHeight) {
                this.minHeight = row;
            } else if (row == this.maxHeight) {
                this.maxHeight = row + 1;
            }
            if (col < this.minWidth) {
                this.minWidth = col;
            } else if (col == this.maxWidth) {
                this.maxWitdh = col + 1;
            }
        }

        const dfs = (row, col, visited, newBoard) => {
            if (visited.has(row + "," + col)) {
                return;
            }
            visited.add(row + "," + col);
            // if a cell is dead then we don't check its neighbors
            // because dead cells are only ever checked if they are the border of an "island" of alive cells
            if (!this.board.has(row + "," + col) && this.rules.shouldLive(false, countNeighbors(row, col))) {
                newBoard.add(row + "," + col);
                updateBoardBoundaries(row, col);
                return;
            }
            for (let i = row - 1; i <= row + 1; ++i) {
                for (let j = col - 1; j <= col + 1; ++j) {
                    let isAlive = this.board.has(i + "," + j);
                    let numNeighbors = countNeighbors(i, j);
                    let shouldLive = this.rules.shouldLive(isAlive, numNeighbors);
                    if (shouldLive) {
                        newBoard.add(i + "," + j);
                        updateBoardBoundaries(i, j);
                        if (!(i == row && j == col)) {
                            dfs(i, j, visited, newBoard);
                        }
                    }
                }
            }
        }

        let visited = new Set();
        let newBoard = new Set();
        for (let loc of this.board) {
            const rowCol = loc.split(",");
            const row = +rowCol[0];
            const col = +rowCol[1];
            dfs(row, col, visited, newBoard);
        }
        this.board = newBoard;
    }

    async playGame(delay) {
        while (true) {
            document.getElementById("gameSpace").textContent = this.toString();
            await sleep(delay);
            this.fastNextState();
        }
    }
}

/**
 * Load a `Game` from URL parameters
 */
function playFromParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const initHeight = urlParams.get("height") ? +urlParams.get("height") : 100;
    const initWidth = urlParams.get("width") ? +urlParams.get("width") : 100;
    const initDensity = urlParams.get("density") ? +urlParams.get("density") : 0.5;
    const delay = urlParams.get("delay") ? +urlParams.get("delay") : 500;
    window.addEventListener("load", () => {
        g = new Game(initHeight, initWidth, initDensity);
        g.playGame(delay);
    });
}

playFromParams();
