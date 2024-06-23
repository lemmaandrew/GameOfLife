# Game of Life

A simple implementation of Conway's Game of Life in JavaScript and HTML
just to prove that I can write in JavaScript and HTML.

URL parameters:
* `height`: The initial height of the game space
* `width`: The initial width of the game space
* `density`: A value from 0 to 1 that indicates what percentage of the game space will be "alive" initially
* `delay`: The delay in milliseconds between game states

**TODO:**
* Implement a more efficient `nextState` algorithm than the simple double `for` loop present.
