/*
    Backgammon diagram generator
    Copyright (c) 2024 Alessandro Scotti
    MIT License
*/
const CheckerSize = 50;
const BorderWidth = 2;

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
    let centerBearoffSide = boardWidth + barWidth + BorderWidth / 2;
    let centerCubeSide = -centerBearoffSide;

    const svg = [];

    // Create a CSS class in BEM (more or less) notation
    const BemMain = 'bgdiagram';

    function bem(block, modifiers) {
        if (typeof modifiers == 'number') {
            modifiers = (modifiers == White) ? 'white' : 'black';
        }

        return `${BemMain}__${block}` + (modifiers ? modifiers.split(' ').map(m => ` ${BemMain}__${block}--${m}`).join(' ') : '');
    }

    function getBarPosition(player) {
        return (player == White) ? 25 : 0;
    }

    function getOffPosition(player) {
        return (player == White) ? PosOffWhite : PosOffBlack;
    }

    // Return the coordinates of the center for the checker at the specified position:
    // - 1 to 24 are the standard points
    // - PosBarXxx is the bar for player Xxx
    // - PosOffXxx is the (borne) off place for player Xxx
    function getCheckerCenter(pos, height) {
        let cx = 0;
        let cy0 = pointHeight - 1 - BorderWidth / 2;
        let edge; // Top or bottom

        if (pos < 0) {
            cx = centerBearoffSide;
            edge = (pos == PosOffBlack) ? -1 : +1;
            cy0 = 0;
        }
        else if (pos % 25 == 0) {
            // Bar
            edge = pos ? -1 : +1;
            cy0 -= CheckerSize / 2;
        } else {
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

    // Draw an arrow between two points
    function drawArrow(x1, y1, x2, y2, lineWidth = 10, headWidth = 25, headLength = 20) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        // Head base
        const arrowBaseX = x2 - headLength * Math.cos(angle);
        const arrowBaseY = y2 - headLength * Math.sin(angle);

        // Head and line offsets
        const lineOffsetX = (lineWidth / 2) * Math.sin(angle);
        const lineOffsetY = (lineWidth / 2) * -Math.cos(angle);
        const headOffsetX = (headWidth / 2) * Math.sin(angle);
        const headOffsetY = (headWidth / 2) * -Math.cos(angle);

        // Build arrow
        const points = [
            [x1 - lineOffsetX, y1 - lineOffsetY], // Lower line start
            [arrowBaseX - lineOffsetX, arrowBaseY - lineOffsetY], // Lower line end
            [arrowBaseX - headOffsetX, arrowBaseY - headOffsetY], // Head start
            [x2, y2], // Head point
            [arrowBaseX + headOffsetX, arrowBaseY + headOffsetY], // Head end
            [arrowBaseX + lineOffsetX, arrowBaseY + lineOffsetY], // Upper line end
            [x1 + lineOffsetX, y1 + lineOffsetY], // Upper line start
        ].map(point => point.join(',')).join(' ');

        // Crea il poligono della freccia
        addSvg(`<polygon points="${points}" class="${bem('arrow')}" />`);
    }

    // Draw a board point at the specified position
    function drawPoint(pos) {
        const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
        const edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
        const x = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth);
        const sy = edge * pointGap / 2;
        const ey = sy + edge * (pointHeight - 1);

        addSvg(`<polygon points="${x},${ey} ${x + CheckerSize},${ey} ${x + CheckerSize / 2},${sy}" class="${bem('point', pos % 2)}" />`);

        addText(x + CheckerSize / 2, ey + edge * CheckerSize * 0.3, pos, 'point');
    }

    // Draw an empty board
    function drawEmptyBoard() {
        const hx = fullBoardWidth / 2;
        const hy = -boardHeight / 2;

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
    function addArrow(point1, height1, point2, height2) {
        const [cx1, cy1] = getCheckerCenter(point1, height1);
        const [cx2, cy2] = getCheckerCenter(point2, height2);

        drawArrow(cx1, cy1, cx2, cy2);
    }

    // Add checker to specific point (0 or 25 is the bar)
    function addCheckers(player, point, count) {
        const maxcount = point % 25 ? 5 : 4; // One less checker when on bar

        // Draw the checker stack
        for (let c = 0; c < count; c++) {
            const [cx, cy] = getCheckerCenter(point, c);

            addSvg(`<circle cx="${cx}" cy="${cy}" r="${CheckerSize / 2 - BorderWidth / 2 - 0.25}" class="${bem('checker', player)}" />`);

            // If too many checkers, show count and exit
            if (c == (maxcount - 1) && count > maxcount) {
                addText(cx, cy, count, player);
                break;
            }
        }
    }

    // Add a dice to the board, the position range is -2 (closest to the bar) to 3
    function addDice(player, value, pos) {
        const cx = player * (CheckerSize * 2.5 + barWidth / 2 + pos * CheckerSize + BorderWidth);
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
        const x = -(boardWidth + barWidth + BorderWidth / 2);
        const y = player * (pointHeight + CheckerSize * 0.2);

        addText(x, y, `${score}/${matchlen}`, `score${(matchlen > 10) ? ' small' : ''}`);
    }

    // Add the pips count
    function addPipsCount(player, count) {
        addText(0, player * (pointHeight + CheckerSize * 0.2), count, 'pipcount');
    }

    // Add an indicator to show which player is to play
    function addPlayerOnTurnIndicator(player) {
        const r = CheckerSize / 5;
        const x = boardWidth + barWidth + BorderWidth / 2;
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

        addSvg(`<svg width="${viewAreaWidth * scale}" height="${fullBoardHeight * scale}" viewBox="${-viewAreaWidth / 2} ${-fullBoardHeight / 2} ${viewAreaWidth} ${fullBoardHeight}" class="${BemMain}">`);

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
        addArrow,
        addCheckers,
        addCheckersOffboard,
        addCube,
        addDice,
        addPipsCount,
        addPlayerOnTurnIndicator,
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
        // xgid = 'XGID=-b----E-C---eE---c-e----B-:0:0:-1:52:0:0:0:5:10:24/22, 13/8';
        // xgid = 'XGID=-a-a--E-C---dE---d-e----B-:0:0:1:54:0:0:0:5:10:24/20, 13/8';
        // xgid = 'XGID=-a-a--E-D---dD---d-eA---A-:0:0:-1:61:0:0:0:5:10:13/7,8/7'; // TODO: dice position
        // xgid = 'XGID=-a-a--E-D---cD---cbeA---A-:0:0:1:32:0:0:0:5:10:6/3*,3/1*'; // TODO: freccia sovrapposta
        // xgid = 'XGID=bA----D-D---cD---cbeA---A-:0:0:-1:32:0:0:0:5:10:bar/23,bar/22';
        // xgid = 'XGID=-Aaa--D-D---cD---cbeA---A-:0:0:1:42:0:0:0:5:10:24/20,13/11';
        // xgid = 'XGID=-Aaa--D-D--AcC---cbeB-----:0:0:-1:31:0:0:0:5:10:23/22,6/3';
        // xgid = 'XGID=-A-b--D-D--AcC---cbdB-a---:0:0:1:62:0:0:0:5:10:13/5'; // TODO: è due mosse in una
        // xgid = 'XGID=-A-b-AD-D--AcB---cbdB-a---:0:0:-1:42:0:0:0:5:10:22/20*,7/3';
        // xgid = 'XGID=-A-a-aD-D--AcB---cadB-b--A:0:0:1:32:0:0:0:5:10:bar/23,8/5*'; // freccia sopra i dadi
        // xgid = 'XGID=-A-a-aD-D--AcB---cadB-b--A:0:0:1:32:0:0:0:5:10:bar/23,8/5*'; // freccia sopra i dadi
        // xgid = 'XGID=aA-a-AD-C--AcB---cadB-bA--:0:0:-1:61:0:0:0:5:10:bar/24*,8/2*';
        // xgid = 'XGID=-a-a-AD-C--AcB---badB-ba-B:0:0:1:21:0:0:0:5:10:bar/24,bar/23*';
        // xgid = 'XGID=aa-a-AD-C--AcB---badB-bAA-:0:0:-1:51:0:0:0:5:10:bar/20*,7/6';
        // xgid = 'XGID=-a-a-aD-C--AcB---b-eB-bAAA:0:0:1:62:0:0:0:5:10:bar/23,24/18';
        // xgid = 'XGID=-a-a-aD-C--AcB---bAeB-bB--:0:0:-1:62:0:0:0:5:10:22/14*'; // due in una
        // xgid = 'XGID=-a---aD-C--acB---bAeB-bB-A:0:0:1:43:0:0:0:5:10:bar/21,18/15';
        // xgid = 'XGID=-a---aD-C--acB-A-b-eBAbB--:0:0:-1:54:0:0:0:5:10:24/20,13/8'; // freccia sui dadi
        // xgid = 'XGID=-----bD-C--abB-A-c-eBAbB--:0:0:1:41:0:0:0:5:10:21/20,15/11*';
        // xgid = 'XGID=a----bD-C--AbB---c-eC-bB--:0:0:-1:31:0:0:0:5:10:bar/21'; // 2 in 1
        // xgid = 'XGID=----abD-C--AbB---c-eC-bB--:0:0:1:62:0:0:0:5:10:11/3'; // 2
        // xgid = 'XGID=---AabD-C---bB---c-eC-bB--:0:0:-1:55:0:0:0:5:10:21/11,20/15(2)';
        // xgid = 'XGID=---AabD-C---bB---c-eC-bB--:0:0:-1:55:0:0:0:5:10:21/16,16/11,20/15(2)'; // è quella di prima "espansa"
        // xgid = 'XGID=---A--D-C-b-bBa--c-eC-bB--:0:0:1:54:0:0:0:5:10:8/3,6/2';
        // xgid = 'XGID=--AB--C-B-b-bBa--c-eC-bB--:0:0:-1:61:0:0:0:5:10:11/4';
        // xgid = 'XGID=--AB--C-B-b-bB---c-eCabB--:0:0:1:61:0:0:0:5:10:20/13';
        // xgid = 'XGID=--AB--C-B-b-bC---c-eBabB--:0:0:-1:32:0:0:0:5:10:6/3,6/4';
        // xgid = 'XGID=--ABA-B-C-b-bB---c-cBbcB--:0:0:-1:00:0:0:0:5:10'; // offerta di cubo
        // xgid = 'XGID=--ABA-B-C-b-bB---c-cBbcB--:1:1:-1:00:0:0:0:5:10'; // cubo accettato
        // xgid = 'XGID=--ABA-B-C-b-bB---c-cBbcB--:1:1:-1:33:0:0:0:5:10:13/7(2)';
        // xgid = 'XGID=--ABA-B-C-b--B---cbcBbcB--:1:1:1:54:0:0:0:5:10:8/3,8/4';
        // xgid = 'XGID=--ACB-B-A-b--B---cbcBbcB--:1:1:-1:52:0:0:0:5:10:6/1,3/1';
        // xgid = 'XGID=--ACB-B-A-b--B---cbbBbbBb-:1:1:1:44:0:0:0:5:10:13/5(2)';
        // xgid = 'XGID=--ACBBB-A-b------cbbBbbBb-:1:1:-1:32:0:0:0:5:10:15/12,8/6';
        // xgid = 'XGID=--ACBBB-A-a--a---bbcBbbBb-:1:1:1:53:0:0:0:5:10:8/3,5/2';
        // xgid = 'XGID=--BDBAB-----A----bccAcbBb-:1:1:1:63:0:0:0:5:10:20/14,12/9';
        // xgid = 'XGID=--BDBAB--A----A--bcc-cbBb-:1:1:-1:65:0:0:0:5:10:7/1,6/1';
        // xgid = 'XGID=--BDBAB--A----A--bbb-cbBd-:1:1:1:44:0:0:0:5:10:14/2,9/5'; // 3 in 1
        // xgid = 'XGID=--CDBBB-----------bc-dbBd-:1:1:1:11:0:0:0:5:10:3/1,2/1,3/2';
        // xgid = 'XGID=-BCBBBB-------A----cadcAd-:1:1:-1:51:0:0:0:5:10:5/off,1/off';
        // xgid = 'XGID=-CBBBBC--------A----adc-e-:1:1:-1:54:0:0:0:5:10:5/off,4/off'; // TODO: decidere l'altezza
        // xgid = 'XGID=-CBBBBC-A------------cc-e-:1:1:-1:21:0:0:0:5:10:4/2,1/off';
        // xgid = 'XGID=-CCCBBA-A------------bcad-:1:1:-1:61:0:0:0:5:10:1/off,4/off'; // altezza.. è proprio bruttino
        // xgid = 'XGID=-CCCBBA-A------------acac-:1:1:1:63:0:0:0:5:10:8/5,6/off';
        // xgid = 'XGID=-CCCBC---------------acac-:1:1:-1:43:0:0:0:5:10:4/0,3/0';
        // xgid = 'XGID=-CCCBC----------------bac-:1:1:1:43:0:0:0:5:10:4/0,3/0';
        // xgid = 'XGID=-CCBAC----------------bac-:1:1:-1:53:0:0:0:5:10:3/off(2)';
        // xgid = 'XGID=-CDBAA------------------b-:1:1:1:61:0:0:0:5:10:5/off,4/3';
        // xgid = 'XGID=-CDC--------------------b-:1:1:-1:21:0:0:0:5:10:1/off(2)';

        const bgb = BgDiagramBuilder(options);

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

        // Moves (not in the XGID specs)
        const movelist = xgid.split(':')[10];
        if (movelist) {
            let off = 0;

            const moves = movelist
                .replace('/\*/g', '')
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
                while (repeat--) {
                    const [from, to] = move
                        .split('/')
                        .map(m => m < 0 ? m : player == White ? parseInt(m) : 25 - parseInt(m));

                    const fromHeight = point[from] * player - 1;

                    if (to < 0) {
                        // Bearoff
                        bgb.addArrow(from, fromHeight, to, off++);
                    } else {
                        // Standard move
                        if (point[to] * player < 0) { // Capture
                            point[to] = 0;
                            point[bgb.getBarPosition(-player)] -= player;
                        }
                        const toHeight = Math.abs(point[to]);
                        bgb.addArrow(from, fromHeight, to, toHeight);
                        point[to] += player;
                    }

                    point[from] -= player; // One less checker on the starting point
                }
            });
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
