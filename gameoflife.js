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
        /**
         * Count the number of living neighors of a cell.
         * @param {number} row
         * @param {number} col
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

        /**
         * Update the current board boundaries given a row and column to check against
         * @param {object} currentBoundaries The boundaries that have been seen so far
         * @param {number} row The row to check against
         * @param {number} col The column to check against
         */
        const updateBoardBoundaries = (currentBoundaries, row, col) => {
            if (currentBoundaries.minHeight == null || row < currentBoundaries.minHeight) {
                currentBoundaries.minHeight = row;
            }
            if (currentBoundaries.maxHeight == null || row == currentBoundaries.maxHeight) {
                currentBoundaries.maxHeight = row + 1;
            }
            if (currentBoundaries.minWidth == null || col < currentBoundaries.minWidth) {
                currentBoundaries.minWidth = col;
            }
            if (currentBoundaries.maxWidth == null || col == currentBoundaries.maxWidth) {
                currentBoundaries.maxWidth = col + 1;
            }
        }

        /**
         * Create a new board through dfs.
         * Basically we search for "islands" of alive cells, and only investigate them and their neighors.
         * This avoids checking swaths of empty space to see if they should be alive
         * @param {number} row The row of the current cell
         * @param {number} col The column of the current cell
         * @param {Set<string>} visited The cells already visited
         * @param {Set<string>} newBoard The set of cells that will be alive in the next state
         * @param {object} boundaries The coordinate boundaries of the board that have been measured so far
         */
        const dfs = (row, col, visited, newBoard, boundaries) => {
            if (visited.has(row + "," + col)) {
                return;
            }
            visited.add(row + "," + col);
            // if a cell is dead then we don't check its neighbors
            // because dead cells are only ever checked if they are the border of an "island" of alive cells
            if (!this.board.has(row + "," + col) && this.rules.shouldLive(false, countNeighbors(row, col))) {
                newBoard.add(row + "," + col);
                updateBoardBoundaries(boundaries, row, col);
                return;
            }
            for (let i = row - 1; i <= row + 1; ++i) {
                for (let j = col - 1; j <= col + 1; ++j) {
                    let isAlive = this.board.has(i + "," + j);
                    let numNeighbors = countNeighbors(i, j);
                    let shouldLive = this.rules.shouldLive(isAlive, numNeighbors);
                    if (shouldLive) {
                        newBoard.add(i + "," + j);
                        updateBoardBoundaries(boundaries, i, j);
                        if (!(i == row && j == col)) {
                            dfs(i, j, visited, newBoard, boundaries);
                        }
                    }
                }
            }
        }

        let boundaries = {
            minHeight: this.minHeight,
            minWidth: this.minWidth,
            maxHeight: this.maxHeight,
            maxWidth: this.maxWidth
        };
        let visited = new Set();
        let newBoard = new Set();
        for (let loc of this.board) {
            const rowCol = loc.split(",");
            const row = +rowCol[0];
            const col = +rowCol[1];
            dfs(row, col, visited, newBoard, boundaries);
        }
        this.board = newBoard;
        // the `|| 0` converts a `null` to a `0` just in case the boundary was never updated from null
        this.minHeight = boundaries.minHeight || 0;
        this.minWidth = boundaries.minWidth || 0;
        this.maxHeight = boundaries.maxHeight || 0;
        this.maxWidth = boundaries.maxWidth || 0;
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
