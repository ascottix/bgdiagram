/*
    Backgammon diagram generator
    Copyright (c) 2024-2025 Alessandro Scotti
    MIT License
*/
const CheckerRadius = 25;
const CheckerSize = CheckerRadius * 2;
const BorderWidth = 2;

/*
    Options: see README.md for details.
*/
function BgDiagramBuilder(options) {
    options = options || {};

    const swapColors = options.swapColors ? -1 : +1;

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
    const textAreaHeight = options.compact ? 0 : CheckerRadius;
    const fullBoardWidth = 2 * sideWidth + 2 * boardWidth + barWidth + 2;
    const fullBoardHeight = boardHeight + 2 * BorderWidth + textAreaHeight * 2;
    const viewAreaWidth = fullBoardWidth + BorderWidth * 2;
    const centerRightSide = boardWidth + barWidth + BorderWidth / 2;
    const centerLeftSide = -centerRightSide;
    const [centerBearoffSide, centerCubeSide] = options.homeOnLeft ? [centerLeftSide, centerRightSide] : [centerRightSide, centerLeftSide];

    const svg = [];

    // Create a CSS class in BEM (more or less) notation
    const BemMain = 'bgdiagram';

    function getPlayerClass(player) {
        return (player * swapColors == White) ? 'white' : 'black';
    }

    function bem(block, modifiers) {
        if (typeof modifiers == 'number') {
            modifiers = getPlayerClass(modifiers);
        }

        return `${BemMain}__${block}` + (modifiers ? ' ' + modifiers.split(' ').map(m => `${BemMain}__${block}--${m}`).join(' ') : '');
    }

    function getBarPosition(player) {
        return (player == White) ? 25 : 0;
    }

    function getOffPosition(player) {
        return (player == White) ? PosOffWhite : PosOffBlack;
    }

    function getPointPosition(pos) {
        return options.homeOnLeft ? (pos > 12 ? 37 : 13) - pos : pos;
    }

    // Return the coordinates of the center for the checker at the specified position:
    // - 1 to 24 are the standard points
    // - 0 is White's bar
    // - 25 is Black's bar
    // - PosOffWhite is the place for White's checkers after bearoff
    // - PosOffBlack is the place for Black's checkers after bearoff
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
            cy0 -= CheckerRadius * 1.5;
        } else {
            pos = getPointPosition(pos);

            // Standard point
            const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
            edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
            cx = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth) + CheckerRadius;
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
        const sy = edge * (pointGap / 2 + 1);
        const ey = sy + edge * (pointHeight - 1);

        addSvg(`<polygon points="${x},${ey} ${x + CheckerSize},${ey} ${x + CheckerRadius},${sy + edge * 25}" class="${bem('point', pos % 2 ? 'odd' : 'even')}" />`);
    }

    function drawPointNumber(pos, number) {
        const edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
        const [cx, cy] = getCheckerCenter(pos, 0);
        addText(cx, cy + edge * CheckerSize * 0.82, number, 'point');
    }

    function addPointNumbers(player) {
        for (let p = 1; p <= 24; p++) {
            const number = getPointPosition(p);
            drawPointNumber(number, player == White ? number : 25 - number);
        }
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

    // Add a double arrow
    function addDoubleArrow(point1, height1, point2, height2, mod) {
        const [cx1, cy1] = getCheckerCenter(point1, height1);
        const [cx2, cy2] = getCheckerCenter(point2, height2);

        drawDoubleArrow(cx1, cy1, cx2, cy2, mod);
    }

    // Add a polygon
    function addPolygon(points, mod) {
        const className = 'polygon';

        points = points.map(p => getCheckerCenter(p[0], p[1]).join(',')).join(' ');

        addSvg(`<polygon points="${points}" class="${bem(className, 'outer')}" />`);
        addSvg(`<polygon points="${points}" class="${bem(className, mod)}" />`);
    }

    // Add a point overlay
    function addPointOverlay(point, mod) {
        const [cx, cy] = getCheckerCenter(point, 0);

        addSvg(`<rect x="${cx - CheckerRadius}" y="${Math.min(cy - CheckerRadius, 0)}" width="${CheckerSize}" height="${boardHeight / 2 - BorderWidth - (cx % 25 ? 0 : CheckerRadius)}" class="${bem('point-overlay', mod)}" />`);
    }

    // Add checker to specific point (0 or 25 is the bar)
    function addCheckers(player, point, count) {
        const CheckerClass = 'checker';
        const maxcount = point % 25 ? 5 : 4; // One less checker when on bar

        // Draw the checker stack
        for (let c = 0; c < count; c++) {
            const [cx, cy] = getCheckerCenter(point, c);
            const pointInfo = options.addPointInfo ? `data-pt="${point}:${c}" ` : '';

            addSvg(`<circle ${pointInfo}cx="${cx}" cy="${cy}" r="${CheckerRadius - BorderWidth / 2 - 0.1}" class="${bem(CheckerClass, player)}" />`);

            // If too many checkers, show count and exit
            if (c == (maxcount - 1) && count > maxcount) {
                addText(cx, cy, count, CheckerClass + '--' + getPlayerClass(player));
                break;
            }
        }
    }

    // Add a dice to the board, the position range is -2 (closest to the bar) to 3
    function addDice(player, value, pos) {
        const cx = (options.homeOnLeft ? -1 : +1) * player * (CheckerSize * 2.5 + barWidth / 2 + pos * CheckerSize + BorderWidth);
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

    // Add the Crawford indicator
    function addCrawfordIndicator() {
        // Nothing for now
        const cx = centerCubeSide;

        addText(cx, -10, 'CRAW', 'crawford');
        addText(cx, +10, 'FORD', 'crawford');
    }

    // Add the cube
    function addCube(player, value, mode) {
        const size = Math.round(CheckerSize * 0.4);
        const cx = centerCubeSide;
        const cy = player * (pointHeight + (mode ? 1 : -1) * CheckerSize * 0.3 - size);

        addSvg(`<rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" ry="4" class="${bem('cube')}"/>`);
        addText(cx, cy, value, 'cube');
    }

    // Add a player score
    function addScore(player, score) {
        const x = centerCubeSide;
        const y = player * (pointHeight + CheckerSize * 0.1);

        addText(x, y, score, `${getPlayerClass(player)} score${(score.length > 3) ? ' small' : ''}`);
    }

    // Add the pips count
    function addPipsCount(player, count) {
        addText(0, player * (pointHeight + CheckerSize * 0.1), count, `pipcount ${getPlayerClass(player)}`);
    }

    // Add an indicator to show which player is to play
    function addPlayerOnTurnIndicator(player, mode) {
        const r = CheckerSize / 5;
        const ModeOffsetX = [centerBearoffSide, 0, centerCubeSide];
        const ModeOffsetY = [boardHeight / 2 + BorderWidth * 2 + r, pointHeight + CheckerSize * 0.09, CheckerSize * 3];
        const x = ModeOffsetX[mode || 0];
        const y = player * ModeOffsetY[mode || 0];

        if (mode) {
            const ArrowHalfSize = CheckerSize * 0.4;
            const dir = options.homeOnLeft ? -1 : +1;
            drawArrow(x - dir * ArrowHalfSize, y, x + dir * ArrowHalfSize, y, getPlayerClass(player));
        } else {
            addSvg(`<circle cx="${x}" cy="${y}" r="${r}" class="${bem('checker', 'turn ' + getPlayerClass(player))}" />`);
        }
    }

    function getUsedCssStyles() {
        return new Set(['dominant-baseline', 'fill', 'fill-opacity', 'font-family', 'font-size', 'font-weight', 'stroke', 'stroke-opacity', 'stroke-width', 'text-anchor', 'transform']);
    }

    // Close the board and return the generated SVG
    function close() {
        addSvg(`</svg>`);

        return svg.join('');
    }

    // Reset the builder to the initial state
    function reset() {
        const attrs = [];

        attrs.push(`viewBox="${-viewAreaWidth / 2} ${-fullBoardHeight / 2} ${viewAreaWidth} ${fullBoardHeight}"`);
        attrs.push('role="img"');
        attrs.push('aria-label="Diagram of a backgammon game position"');

        // Width and height
        options.width && attrs.push(`width="${options.width}"`.replace('#', viewAreaWidth));
        options.height && attrs.push(`height="${options.height}"`.replace('#', fullBoardHeight));

        // Class names
        const classes = options.classNames || [];

        classes.length && attrs.push(`class="${classes.join(' ')}"`);

        // Clear and reinitialize the SVG buffer
        svg.length = 0;

        addSvg(`<svg ${attrs.join(' ')}>`);

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
        getUsedCssStyles,
        addArrow,
        addCheckers,
        addCheckersOffboard,
        addCrawfordIndicator,
        addCube,
        addDice,
        addDoubleArrow,
        addPipsCount,
        addPlayerOnTurnIndicator,
        addPointNumbers,
        addPointOverlay,
        addPolygon,
        addScore,
        addSvg,
        addText,
        close,
        reset
    });
}

export class BgDiagram {
    // Create a new builder
    static newBuilder(options) {
        return BgDiagramBuilder(options);
    }

    // Return a regex to check if a string looks like a valid XGID with extended annotation syntax
    static getIsValidXgidRegEx() {
        const Point = '\\d+(\\.\\d+)?,\\d+(\\.\\d+)?';
        const Move = '(\\d+|bar)\\/(\\d+|off)(\\*|\\([2-4]\\))?';
        const MoveList = `${Move}(,${Move})*[!?]*`;
        const XGID = 'XGID=[-a-oA-O]{26}:\\d+:-?[01]:-?1:(00|[DBR]|[1-6]{2}):\\d+:\\d+:[0-3]:\\d+:\\d+';
        const AnnArrow = `[AD]${Point}-${Point}`;
        const AnnPolygon = `P${Point}(-${Point})*`;
        const AnnText = `T${Point}-[^:]+`;
        const RegEx = `^${XGID}(:(${MoveList}|${AnnArrow}|${AnnPolygon}|${AnnText}))*$`;

        return RegEx;
    }

    // Create a new diagram from an XGID
    static fromXgid(xgid, options) {
        const bgb = options.builder || BgDiagramBuilder(options);

        const White = bgb.White;
        const Black = bgb.Black;

        // Remove prefix
        const XgidPrefix = 'XGID=';

        if (xgid.startsWith(XgidPrefix)) {
            xgid = xgid.substring(XgidPrefix.length);
        }

        // Get annotations
        const annotations = xgid.split(':').slice(10);

        // Process option annotations
        const params = {}

        for (const annotation of annotations) {
            if (annotation[0] == 'O') {
                const param = annotation[1];
                const value = annotation.substring(2);

                switch (param) {
                    case 'n':
                        params.hideNumbers = value == '-';
                        break;
                    case 'p':
                        params.hidePipcount = value == '-';
                        break;
                }
            }
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

        // Turn
        const player = token[3];
        const turnIndicatorMode = options.turnIndicatorMode == null ? (options.compact ? 2 : 0) : options.turnIndicatorMode;

        bgb.addPlayerOnTurnIndicator(player, turnIndicatorMode);
        !options.compact && !params.hideNumbers && bgb.addPointNumbers(player);

        // Match information
        const matchLength = token[8];

        if (matchLength > 0) {
            const scoreWhite = options.scoreAsAway ? `${matchLength - token[5]}a` : `${token[5]}⧸${matchLength}`;
            const scoreBlack = options.scoreAsAway ? `${matchLength - token[6]}a` : `${token[6]}⧸${matchLength}`;
            bgb.addScore(White, scoreWhite);
            bgb.addScore(Black, scoreBlack);
        }

        // Cube
        const cubeValue = token[1] || 6; // Defaults to 2^6=64
        const cubePosition = token[2];

        if (matchLength > 0 && token[7]) {
            bgb.addCrawfordIndicator();
        } else {
            bgb.addCube(cubePosition, 1 << cubeValue, matchLength == 0 ? 1 : 0);
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
                arrowmod = { '??': 'blunder', '?': 'error', '?!': 'dubious', '!': 'good', '!!': 'best' }[ann[0]];
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

        function handleDrawDoubleArrow(points) {
            const [[p1, h1], [p2, h2]] = parsePointList(points);
            bgb.addDoubleArrow(p1, h1, p2, h2, classAnnotation);
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

        // Process draw annotations
        for (const annotation of annotations) {
            switch (annotation[0]) {
                case 'A':
                    handleDrawArrow(annotation);
                    break;
                case 'D':
                    handleDrawDoubleArrow(annotation);
                    break;
                case 'P':
                    handleDrawPolygon(annotation);
                    break;
                case 'O':
                case 'T':
                    // Handled later
                    break;
                default:
                    handleMoveList(annotation);
                    break;
            }
        }

        // Dice
        const d1 = Math.floor(token[4] / 10);
        const d2 = token[4] % 10;

        if (d1 >= 1 && d1 <= 6 && d2 >= 1 && d2 <= 6) {
            bgb.addDice(player, d1, 0);
            bgb.addDice(player, d2, 1);
        }

        // Pips count
        if (!params.hidePipcount) {
            bgb.addPipsCount(White, pips[White]);
            bgb.addPipsCount(Black, checkers[Black] * 25 - pips[Black]);
        }

        // Text annotations go last
        for (const annotation of annotations) {
            if (annotation[0] == 'T') {
                handleDrawText(annotation);
            }
        }

        // Return SVG
        return bgb.close();
    }
}
