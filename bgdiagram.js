/*
    Backgammon diagram generator
    Copyright (c) 2024 Alessandro Scotti
    MIT License
*/
const CheckerSize = 50;
const BorderWidth = 2;

function BgDiagramBuilder(scale = 1) {
    const White = +1;
    const Black = -1;

    const boardWidth = 6 * CheckerSize + BorderWidth;
    const pointGap = CheckerSize;
    const pointHeight = 5 * CheckerSize;
    const boardHeight = 2 * pointHeight + pointGap;
    const barWidth = CheckerSize + 2 * BorderWidth;
    const sideWidth = barWidth;
    const textAreaHeight = CheckerSize / 2;
    const fullBoardWidth = 2 * sideWidth + 2 * boardWidth + barWidth + 2;
    const fullBoardHeight = boardHeight + 2 * BorderWidth + textAreaHeight * 2;
    const viewAreaWidth = fullBoardWidth + BorderWidth * 2;

    const html = [];

    const BemMain = 'bgdiagram';

    function bem(block, mod) {
        if (typeof mod == 'number') {
            mod = (mod == White) ? 'white' : 'black';
        }

        return `${BemMain}__${block}` + (mod ? ` ${BemMain}__${block}--${mod}` : '');
    }

    function rect(x, y, w, h, c) {
        html.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c || bem('board-frame')}"/>`);
    }

    function text(x, y, text, mod) {
        html.push(`<text x="${x}" y="${y}" class="${bem('text', mod)}">${text}</text>`);
    }


    // Draw a board point at the specified position
    function drawPoint(pos) {
        const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
        const edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
        const x = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth);
        const sy = edge * pointGap / 2;
        const ey = sy + edge * (pointHeight - 1);

        html.push(`<polygon id="point" points="${x},${ey} ${x + CheckerSize},${ey} ${x + CheckerSize / 2},${sy}" class="${bem('point', pos % 2)}" />`);

        text(x + CheckerSize / 2, ey + edge * CheckerSize * 0.3, pos, 'point');
    }

    // Draw an empty board
    function drawEmptyBoard() {
        rect(-fullBoardWidth / 2, -boardHeight / 2, fullBoardWidth, boardHeight, bem('board')); // Full board
        rect(-barWidth / 2, -boardHeight / 2, barWidth, boardHeight); // Bar
        rect(-fullBoardWidth / 2, -boardHeight / 2, sideWidth, boardHeight); // Left side
        rect(fullBoardWidth / 2 - sideWidth, -boardHeight / 2, sideWidth, boardHeight); // Right side

        for (let p = 1; p <= 24; p++) {
            drawPoint(p);
        }
    }

    // Add checker to specific point (0 or 25 is the bar)
    function addCheckers(player, point, count) {
        // Set reference points assuming checker is on bar
        let edge = -player;
        let cx = 0;
        let ey = edge * (pointHeight - 1 - BorderWidth / 2 - CheckerSize / 2);
        let maxcount = 4;

        // Adjust reference points if not on bar
        if (point > 0 && point < 25) {
            const side = (point >= 7 && point <= 18) ? -1 : +1; // Left or right board
            edge = (point <= 12) ? 1 : -1; // Bottom or top edge
            cx = (point <= 12 ? 6 - point : point - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth) + CheckerSize / 2;
            ey = edge * (pointHeight - 1 - BorderWidth / 2);
            maxcount++;
        }

        // Draw the checker stack
        for (let c = 0; c < count; c++) {
            const cy = ey - c * edge * CheckerSize;

            html.push(`<circle cx="${cx}" cy="${cy}" r="${CheckerSize / 2 - BorderWidth / 2}" class="${bem('checker', player)}" />`);

            // If too many checkers, show count and exit
            if (c == (maxcount - 1) && count > maxcount) {
                text(cx, cy, count, player);
                break;
            }
        }
    }

    // Add a dice to the board, the position range is -2 (closest to the bar) to 3
    function addDice(value, pos) {
        const cx = (CheckerSize * 2.5 + barWidth / 2 + pos * CheckerSize + BorderWidth);
        const hsize = CheckerSize * 0.4;

        // Draw an empty dice
        html.push(`<rect x="${cx - hsize}" y="${-hsize}" width="${hsize * 2}" height="${hsize * 2}" ry="${BorderWidth * 3}" class="${bem('dice')}"/>`);

        // Draw the dice dots
        function dot(x, y) {
            html.push(`<circle cx="${cx + x * 10}" cy="${y * 10}" r="${CheckerSize / 12}" class="${bem('dice-dot')}" />`);
        }

        (value & 1) && dot(0, 0);
        (value & 6) && dot(-1, -1) | dot(1, 1);
        (value & 4) && dot(-1, 1) | dot(1, -1);
        (value == 6) && dot(-1, 0) | dot(1, 0);
    }

    // Add boreoff checkers
    function addOffCheckers(player, count) {
        const x = boardWidth + barWidth + BorderWidth / 2;
        const y = player * pointHeight;
        const hsize = CheckerSize * 0.45;
        const vsize = CheckerSize * 0.10;
        const vstep = vsize * 2 + 4;

        for (let i = 0; i < count; i++) {
            html.push(`<rect x="${x - hsize}" y="${y - player * (i - 1) * vstep - vsize}" width="${hsize * 2}" height="${vsize * 2}" ry="3" class="${bem('checker', player)}"/>`);
        }

        count && html.push(`<text x="${x}" y="${y - player * count * vstep}" class="${bem('text')}">${count}</text>`);
    }

    // Add the cube
    function addCube(player, value) {
        const size = Math.round(CheckerSize * 0.4);
        const cx = -(boardWidth + barWidth + BorderWidth / 2);
        const cy = player * (pointHeight - CheckerSize * 0.3 - size);

        html.push(`<rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" ry="4" class="${bem('cube')}"/>`);
        text(cx, cy, value);
    }

    // Add a player score
    function addScore(player, score, matchlen) {
        const mod = (matchlen > 10) && 'small';
        const x = -(boardWidth + barWidth + BorderWidth / 2);
        const y = player * (pointHeight + CheckerSize * 0.2);

        text(x, y, `${score}/${matchlen}`, mod);
    }

    // Add the pips count
    function addPipsCount(player, count) {
        text(0, player * (pointHeight + CheckerSize * 0.2), count);
    }

    // Add an indicator to show which player is to play
    function addPlayerOnTurnIndicator(player) {
        const r = CheckerSize / 5;
        const x = boardWidth + barWidth + BorderWidth / 2;
        const y = player * (boardHeight / 2 + BorderWidth * 2 + r);

        html.push(`<circle cx="${x}" cy="${y}" r="${r}" class="${bem('checker', player)}" />`);
    }

    // Close the board and return the generated SVG
    function close() {
        html.push(`</svg>`);

        return html.join('');
    }

    // Initialize
    html.push(`<svg width="${viewAreaWidth * scale}" height="${fullBoardHeight * scale}" viewBox="${-viewAreaWidth / 2} ${-fullBoardHeight / 2} ${viewAreaWidth} ${fullBoardHeight}" class="bgdiagram">`);

    drawEmptyBoard();

    // Return builder interface
    return Object.freeze({
        White,
        Black,
        addCheckers,
        addCube,
        addDice,
        addOffCheckers,
        addPipsCount,
        addPlayerOnTurnIndicator,
        addScore,
        close
    });
}

class BgDiagram {
    static newBuilder() {
        return BgDiagramBuilder();
    }

    static fromXgid(xgid) {
        const bgb = BgDiagramBuilder();

        const White = bgb.White;
        const Black = bgb.Black;

        // Remove prefix
        const XgidPrefix = 'XGID=';

        if (xgid.startsWith(XgidPrefix)) {
            xgid = xgid.substring(XgidPrefix.length);
        }

        // Tokenize
        const token = xgid.split(':').map(t => parseInt(t));

        // Checkers
        const pips = { [White]: 0, [Black]: 0 };
        const checkers = { [White]: 0, [Black]: 0 };

        for (let point = 0; point <= 25; point++) {
            let player = White;
            let count = xgid.codePointAt(point) - 64;
            if (count > 0) {
                if (count > 15) {
                    count -= 32;
                    player = Black;
                }
                pips[player] += point * count;
                checkers[player] += count;
                bgb.addCheckers(player, point, count);
            }
        }

        bgb.addOffCheckers(White, 15 - checkers[White]);
        bgb.addOffCheckers(Black, 15 - checkers[Black]);

        bgb.addPipsCount(White, pips[White]);
        bgb.addPipsCount(Black, checkers[Black] * 25 - pips[Black]);

        // Cube
        const cubeValue = token[1] || 6; // Defaults to 2^6=64
        const cubePosition = token[2];

        bgb.addCube(cubePosition, 1 << cubeValue);

        // Turn
        bgb.addPlayerOnTurnIndicator(token[3]);

        // Dice
        const diceValue = token[4];

        if (diceValue >= 11 && diceValue <= 66) {
            bgb.addDice(Math.floor(diceValue / 10), 0);
            bgb.addDice(diceValue % 10, 1);
        }

        // Match information
        const matchLength = token[8];

        if (matchLength > 0) {
            bgb.addScore(White, token[5], matchLength);
            bgb.addScore(Black, token[6], matchLength);
        }

        // Return SVG
        return bgb.close();
    }
}
