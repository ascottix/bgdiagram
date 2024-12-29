/*
    Backgammon diagram generator
    Copyright (c) 2024 Alessandro Scotti
    MIT License
*/
const CheckerSize = 50;
const BorderWidth = 2;

/*
    Options:
    - flipx: home board on the left side
    - scale: scale factor for the SVG output (default: 1)
*/
function BgDiagramBuilder(options) {
    options = options || {};

    const White = +1;
    const Black = -1;

    const PosOffWhite = -25;
    const PosOffBlack = -50;

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
    const centerRightSide = boardWidth + barWidth + BorderWidth / 2;
    const centerLeftSide = -centerRightSide;
    const [centerBearoffSide, centerCubeSide] = options.flipx ? [centerLeftSide, centerRightSide] : [centerRightSide, centerLeftSide];

    const svg = [];

    // Create a CSS class in BEM (more or less) notation
    const BemMain = 'bgdiagram';

    function getPlayerClass(player) {
        return (player == White) ? 'white' : 'black';
    }

    function bem(block, modifiers) {
        if (typeof modifiers == 'number') {
            modifiers = getPlayerClass(modifiers);
        }

        return `${BemMain}__${block}` + (modifiers ? modifiers.split(' ').map(m => ` ${BemMain}__${block}--${m}`).join(' ') : '');
    }

    function getBarPosition(player) {
        return (player == White) ? 25 : 0;
    }

    function getOffPosition(player) {
        return (player == White) ? PosOffWhite : PosOffBlack;
    }

    function getPointPosition(pos) {
        return options.flipx ? (pos > 12 ? 37 : 13) - pos : pos;
    }

    // Return the coordinates of the center for the checker at the specified position:
    // - 1 to 24 are the standard points
    // - 0 is White's bar
    // - 25 is Black's bar
    // - PosOffWhite is the (borne) off place for White
    // - PosOffBlack is the (borne) off place for Black
    function getCheckerCenter(pos, height) {
        let cx = 0;
        let cy0 = pointHeight - 1 - BorderWidth / 2;
        let edge; // Top or bottom

        if (pos < 0) {
            cx = centerBearoffSide - 15 * Math.sign(centerBearoffSide);
            edge = (pos == PosOffBlack) ? -1 : +1;
        }
        else if (pos % 25 == 0) {
            // Bar
            edge = pos ? -1 : +1;
            cy0 -= CheckerSize / 2;
        } else {
            pos = getPointPosition(pos);

            // Standard point
            const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
            edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
            cx = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth) + CheckerSize / 2;
        }

        const cy = edge * (cy0 - height * CheckerSize);

        return [cx, cy];
    }

    // Add to the SVG buffer
    function addSvg(fragment) {
        svg.push(fragment);
    }

    function getArrowPoints(x1, y1, x2, y2, shortenFactorAtStart, shortenFactorAtEnd) {
        const LineWidth = CheckerSize * 0.2;
        const HeadWidth = CheckerSize * 0.5;
        const HeadLength = CheckerSize * 0.4;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        // Shorten the arrow slightly at the start
        const adjustedX1 = x1 + shortenFactorAtStart * HeadLength * Math.cos(angle);
        const adjustedY1 = y1 + shortenFactorAtStart * HeadLength * Math.sin(angle);

        // Shorten the arrow slightly at the end
        const adjustedX2 = x2 - shortenFactorAtEnd * HeadLength * Math.cos(angle);
        const adjustedY2 = y2 - shortenFactorAtEnd * HeadLength * Math.sin(angle);

        // Head base
        const arrowBaseX = adjustedX2 - HeadLength * Math.cos(angle);
        const arrowBaseY = adjustedY2 - HeadLength * Math.sin(angle);

        // Head and line offsets
        const lineOffsetX = (LineWidth / 2) * Math.sin(angle);
        const lineOffsetY = (LineWidth / 2) * -Math.cos(angle);
        const headOffsetX = (HeadWidth / 2) * Math.sin(angle);
        const headOffsetY = (HeadWidth / 2) * -Math.cos(angle);

        // Build arrow
        return [
            [adjustedX1 - lineOffsetX, adjustedY1 - lineOffsetY], // Lower line start
            [arrowBaseX - lineOffsetX, arrowBaseY - lineOffsetY], // Lower line end
            [arrowBaseX - headOffsetX, arrowBaseY - headOffsetY], // Head start
            [adjustedX2, adjustedY2], // Head point
            [arrowBaseX + headOffsetX, arrowBaseY + headOffsetY], // Head end
            [arrowBaseX + lineOffsetX, arrowBaseY + lineOffsetY], // Upper line end
            [adjustedX1 + lineOffsetX, adjustedY1 + lineOffsetY], // Upper line start
        ]
    }

    function drawDoubleArrow(x1, y1, x2, y2, mod) {
        // Rather than redoing all the math, we just merge two half-arrows
        const mx = (x2 - x1) / 2;
        const my = (y2 - y1) / 2;
        const points1 = getArrowPoints(x1 + mx, y1 + my, x1, y1, 0, 0);
        const points2 = getArrowPoints(x1 + mx, y1 + my, x2, y2, 0, 0);
        points1.pop();
        points2.pop();
        const points = [...points1, ...points2];

        addSvg(`<polygon points="${points.map(point => point.join(',')).join(' ')}" class="${bem('arrow', mod)}" />`);
    }

    function drawArrow(x1, y1, x2, y2, mod) {
        const points = getArrowPoints(x1, y1, x2, y2, 0.1, 0);

        // Creates the arrow polygon
        addSvg(`<polygon points="${points.map(point => point.join(',')).join(' ')}" class="${bem('arrow', mod)}" />`);
    }

    // Draw a board point at the specified position
    function drawPoint(pos) {
        const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
        const edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
        const x = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth);
        const sy = edge * pointGap / 2;
        const ey = sy + edge * (pointHeight - 1);

        addSvg(`<polygon points="${x},${ey} ${x + CheckerSize},${ey} ${x + CheckerSize / 2},${sy}" class="${bem('point', pos % 2)}" />`);

        addText(x + CheckerSize / 2, ey + edge * CheckerSize * 0.3, getPointPosition(pos), 'point');
    }

    // Draw an empty board
    function drawEmptyBoard() {
        const hx = fullBoardWidth / 2;
        const hy = -boardHeight / 2;

        // Background
        addSvg(`<rect x="${-hx}" y="${-fullBoardHeight / 2}" width="${fullBoardWidth}" height="${fullBoardHeight}" class="${bem('background')}"/>`);

        // Playing area
        addSvg(`<rect x="${-hx}" y="${hy}" width="${fullBoardWidth}" height="${boardHeight}" class="${bem('board')}"/>`); // Full board

        // Points
        for (let p = 1; p <= 24; p++) {
            drawPoint(p);
        }

        // Board frame
        function frame(x, y, w, mod) {
            addSvg(`<rect x="${x}" y="${y}" width="${w}" height="${boardHeight}" class="${bem('board-frame', mod)}"/>`);
        }

        frame(-barWidth / 2, hy, barWidth); // Bar
        frame(-hx, hy, sideWidth); // Left side
        frame(hx - sideWidth, hy, sideWidth); // Right side

        frame(-hx, hy, fullBoardWidth, 'nofill'); // Frame around the whole board
    }

    // Add text to specified position
    function addText(x, y, text, mod) {
        addSvg(`<text x="${x}" y="${y}" class="${bem('text', mod)}">${text}</text>`);
    }

    // Add an arrow
    function addArrow(point1, height1, point2, height2, mod) {
        const [cx1, cy1] = getCheckerCenter(point1, height1);
        const [cx2, cy2] = getCheckerCenter(point2, height2);

        drawArrow(cx1, cy1, cx2, cy2, mod);
    }

    // Add a polygon
    function addPolygon(points, mod) {
        const className = 'polygon';

        points = points.map(p => getCheckerCenter(p[0], p[1]).join(',')).join(' ');

        addSvg(`<polygon points="${points}" class="${bem(className, 'outer')}" />`);
        addSvg(`<polygon points="${points}" class="${bem(className, mod)}" />`);
    }

    // Add checker to specific point (0 or 25 is the bar)
    function addCheckers(player, point, count) {
        const CheckerClass = 'checker';
        const maxcount = point % 25 ? 5 : 4; // One less checker when on bar

        // Draw the checker stack
        for (let c = 0; c < count; c++) {
            const [cx, cy] = getCheckerCenter(point, c);

            addSvg(`<circle cx="${cx}" cy="${cy}" r="${CheckerSize / 2 - BorderWidth / 2 - 0.25}" class="${bem(CheckerClass, player)}" />`);

            // If too many checkers, show count and exit
            if (c == (maxcount - 1) && count > maxcount) {
                addText(cx, cy, count, CheckerClass + '--' + getPlayerClass(player));
                break;
            }
        }
    }

    // Add a dice to the board, the position range is -2 (closest to the bar) to 3
    function addDice(player, value, pos) {
        const cx = (options.flipx ? -1 : +1) * player * (CheckerSize * 2.5 + barWidth / 2 + pos * CheckerSize + BorderWidth);
        const hsize = CheckerSize * 0.4;

        // Draw an empty dice
        addSvg(`<rect x="${cx - hsize}" y="${-hsize}" width="${hsize * 2}" height="${hsize * 2}" ry="${BorderWidth * 3}" class="${bem('dice', player)}"/>`);

        // Draw the dice dots
        function dot(x, y) {
            addSvg(`<circle cx="${cx + x * 10}" cy="${y * 10}" r="${CheckerSize / 12}" class="${bem('dice-dot', player)}" />`);
        }

        (value & 1) && dot(0, 0);
        (value & 6) && dot(-1, -1) | dot(1, 1);
        (value & 4) && dot(-1, 1) | dot(1, -1);
        (value == 6) && dot(-1, 0) | dot(1, 0);
    }

    // Add checkers that have been removed from the board
    function addCheckersOffboard(player, count) {
        const x = centerBearoffSide;
        const y = player * pointHeight;
        const hsize = CheckerSize * 0.45;
        const vsize = CheckerSize * 0.10;
        const vstep = vsize * 2 + 4;

        for (let i = 0; i < count; i++) {
            addSvg(`<rect x="${x - hsize}" y="${y - player * (i - 1) * vstep - vsize}" width="${hsize * 2}" height="${vsize * 2}" ry="3" class="${bem('checker', player)}"/>`);
        }

        count && addSvg(`<text x="${x}" y="${y - player * count * vstep}" class="${bem('text', 'offboard')}">${count}</text>`);
    }

    // Add the cube
    function addCube(player, value) {
        const size = Math.round(CheckerSize * 0.4);
        const cx = centerCubeSide;
        const cy = player * (pointHeight - CheckerSize * 0.3 - size);

        addSvg(`<rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" ry="4" class="${bem('cube')}"/>`);
        addText(cx, cy, value);
    }

    // Add a player score
    function addScore(player, score, matchlen) {
        const x = centerCubeSide;
        const y = player * (pointHeight + CheckerSize * 0.2);

        addText(x, y, `${score}/${matchlen}`, `${getPlayerClass(player)} score${(matchlen > 10) ? ' small' : ''}`);
    }

    // Add the pips count
    function addPipsCount(player, count) {
        addText(0, player * (pointHeight + CheckerSize * 0.2), count, `pipcount ${getPlayerClass(player)}`);
    }

    // Add an indicator to show which player is to play
    function addPlayerOnTurnIndicator(player) {
        const r = CheckerSize / 5;
        const x = centerBearoffSide;
        const y = player * (boardHeight / 2 + BorderWidth * 2 + r);

        addSvg(`<circle cx="${x}" cy="${y}" r="${r}" class="${bem('checker', player)}" />`);
    }

    // Close the board and return the generated SVG
    function close() {
        addSvg(`</svg>`);

        return svg.join('');
    }

    // Reset the builder to the initial state
    function reset() {
        const scale = options.scale || 1;

        svg.length = 0;

        addSvg(`<svg width="${viewAreaWidth * scale}" height="${fullBoardHeight * scale}" viewBox="${-viewAreaWidth / 2} ${-fullBoardHeight / 2} ${viewAreaWidth} ${fullBoardHeight}" class="${BemMain}" role="img" aria-label="Diagram of a backgammon game position">`);

        drawEmptyBoard();
    }

    // Initialize
    reset();

    // Return builder interface
    return Object.freeze({
        White,
        Black,
        getBarPosition,
        getOffPosition,
        getCheckerCenter,
        addArrow,
        addCheckers,
        addCheckersOffboard,
        addCube,
        addDice,
        addPipsCount,
        addPlayerOnTurnIndicator,
        addPolygon,
        addScore,
        addSvg,
        addText,
        close,
        reset
    });
}

class BgDiagram {
    static newBuilder(options) {
        return BgDiagramBuilder(options);
    }

    static fromXgid(xgid, options) {
        const bgb = BgDiagramBuilder(options);

        const White = bgb.White;
        const Black = bgb.Black;

        // Remove prefix
        const XgidPrefix = 'XGID=';

        if (xgid.startsWith(XgidPrefix)) {
            xgid = xgid.substring(XgidPrefix.length);
        }

        // Tokenize
        const token = xgid.split(':').map(Number);

        // Checkers
        const pips = { [White]: 0, [Black]: 0 };
        const checkers = { [White]: 0, [Black]: 0 };
        const point = new Array(26).fill(0);

        for (let pos = 0; pos <= 25; pos++) {
            let player = White;
            let count = xgid.codePointAt(pos) - 64;
            if (count > 0) {
                if (count > 15) {
                    count -= 32;
                    player = Black;
                }
                pips[player] += pos * count;
                checkers[player] += count;
                point[pos] = count * player;
                bgb.addCheckers(player, pos, count);
            }
        }

        bgb.addCheckersOffboard(White, 15 - checkers[White]);
        bgb.addCheckersOffboard(Black, 15 - checkers[Black]);

        bgb.addPipsCount(White, pips[White]);
        bgb.addPipsCount(Black, checkers[Black] * 25 - pips[Black]);

        // Cube
        const cubeValue = token[1] || 6; // Defaults to 2^6=64
        const cubePosition = token[2];

        bgb.addCube(cubePosition, 1 << cubeValue);

        // Turn
        const player = token[3];

        bgb.addPlayerOnTurnIndicator(player);

        // Match information
        const matchLength = token[8];

        if (matchLength > 0) {
            bgb.addScore(White, token[5], matchLength);
            bgb.addScore(Black, token[6], matchLength);
        }

        // Annotation support functions
        const classAnnotation = 'annotation';

        function parsePointList(points) {
            return points.substring(1).split('-').map(p => p.split(',').map(Number));
        }

        function handleMoveList(movelist) {
            let totaloff = 0; // Keep track of checkers that bear off

            let arrowmod; // Arrow class modifier

            const ann = movelist.match(/([!?]+)$/);
            if (ann) {
                arrowmod = { '??': 'blunder', '?': 'error', '!': 'good', '!!': 'best' }[ann[0]];
                movelist = movelist.slice(0, -ann[0].length);
            }

            // Put the moves into an array
            const moves = movelist
                .replace(/\*/g, '')
                .replace(/bar/g, '25')
                .replace(/\/off|\/0/g, `/${bgb.getOffPosition(player)}`)
                .split(/\s*,\s*|\s+/);

            moves.forEach(move => {
                // Handle doubles like 13/5(2)
                let repeat = 1;
                const p = move.indexOf('(');
                if (p > 0) {
                    repeat = parseInt(move.substring(p + 1));
                    move = move.substring(0, p);
                }

                // Apply the move(s)
                for (let i = 0; i < repeat; i++) {
                    const [from, to] = move
                        .split('/')
                        .map(m => m < 0 ? m : player == White ? parseInt(m) : 25 - parseInt(m));

                    const crossover = from >= 1 && from <= 24 && to >= 1 && to <= 24 && Math.sign(to - 12) != Math.sign(from - 12);
                    const fromHeight = point[from] * player + (crossover ? -1 : i * 2 - repeat); // Try to avoid crossing arrows

                    if (to < 0) {
                        // Bearoff
                        bgb.addArrow(from, fromHeight, to, totaloff++, arrowmod);
                    } else {
                        // Standard move
                        if (point[to] * player < 0) { // Capture
                            point[to] = 0;
                            point[bgb.getBarPosition(-player)] -= player;
                        }
                        const toHeight = Math.abs(point[to]);
                        bgb.addArrow(from, fromHeight, to, toHeight, arrowmod);
                        point[to] += player;
                    }

                    point[from] -= player; // One less checker on the starting point
                }
            });
        }

        function handleDrawArrow(points) {
            const [[p1, h1], [p2, h2]] = parsePointList(points);
            bgb.addArrow(p1, h1, p2, h2, classAnnotation);
        }

        function handleDrawPolygon(points) {
            bgb.addPolygon(parsePointList(points), classAnnotation);
        }

        function handleDrawText(annotation) {
            const parts = annotation.split('-');
            const [[px, py]] = parsePointList(parts[0]);
            const [x, y] = bgb.getCheckerCenter(px, py);
            bgb.addText(x, y, parts[1], classAnnotation);
        }

        // Annotations
        const annotations = xgid.split(':').slice(10);

        for (const annotation of annotations) {
            console.log(annotation);
            switch (annotation[0]) {
                case 'A':
                    handleDrawArrow(annotation);
                    break;
                case 'P':
                    handleDrawPolygon(annotation);
                    break;
                case 'T':
                    handleDrawText(annotation);
                    break;
                default:
                    handleMoveList(annotation);
                    break;
            }
        }

        // Dice
        const diceValue = token[4];

        if (diceValue >= 11 && diceValue <= 66) {
            bgb.addDice(player, Math.floor(diceValue / 10), 0);
            bgb.addDice(player, diceValue % 10, 1);
        }

        // Return SVG
        return bgb.close();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BgDiagram; // Export for Node.js
}
