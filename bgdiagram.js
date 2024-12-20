const White = +1;
const Black = -1;

const CheckerSize = 50;
const BorderWidth = 2;

const BemMain = 'bgdiagram';

function bem(block, mod) {
    if (typeof mod == 'number') {
        mod = (mod == White) ? 'white' : 'black';
    }

    return `${BemMain}__${block}` + (mod ? ` ${BemMain}__${block}--${mod}` : '');
}

function drawBoard() {
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

    function rect(x, y, w, h, c) {
        html.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c || bem('board-frame')}"/>`);
    }

    function text(x, y, text, mod) {
        html.push(`<text x="${x}" y="${y}" class="${bem('text', mod)}">${text}</text>`);
    }

    function point(pos) {
        const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
        const edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
        const x = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth);
        const sy = edge * pointGap / 2;
        const ey = sy + edge * (pointHeight - 1);
        html.push(`<polygon id="point" points="${x},${ey} ${x + CheckerSize},${ey} ${x + CheckerSize / 2},${sy}" class="${bem('point', pos % 2)}" />`);
        text(x + CheckerSize / 2, ey + edge * CheckerSize * 0.3, pos);
        // html.push(`<text x="${x + CheckerSize / 2}" y="${ey + edge * CheckerSize * 0.3}" class="${bem('text')}">${pos}</text>`);
    }

    function checker(pos, count, player) {
        if(pos == 0 || pos > 24 ) return bar(player, count);
        const side = (pos >= 7 && pos <= 18) ? -1 : +1; // Left or right board
        const edge = (pos <= 12) ? 1 : -1; // Bottom or top edge
        const cx = (pos <= 12 ? 6 - pos : pos - 19) * CheckerSize + side * (barWidth / 2 + BorderWidth) + CheckerSize / 2;
        const ey = edge * (pointHeight - 1 - BorderWidth / 2);
        for (let c = 0; c < count; c++) {
            const cy = ey - c * edge * CheckerSize;
            html.push(`<circle cx="${cx}" cy="${cy}" r="${CheckerSize / 2 - BorderWidth / 2}" class="${bem('checker', player)}" />`);
            if (c == 4 && count > 5) {
                text(cx, cy, count, player);
                // html.push(`<text x="${cx}" y="${cy}" class="${bem('text', player)}">${count}</text>`);
                break;
            }
        }
    }

    function bar(player, count) {
        const edge = -player;
        const cx = 0;
        const ey = edge * (pointHeight - 1 - BorderWidth / 2 - CheckerSize / 2);
        for (let c = 0; c < count; c++) {
            const cy = ey - c * edge * CheckerSize;
            html.push(`<circle cx="${cx}" cy="${cy}" r="${CheckerSize / 2 - BorderWidth / 2}" class="${bem('checker', player)}" />`);
            if (c == 4 && count > 5) {
                text(cx, cy, count, player);
                // html.push(`<text x="${cx}" y="${cy}" class="${bem('text',player)}">${count}</text>`);
                break;
            }
        }
    }

    function dice(value, pos) {
        const cx = (CheckerSize * 2.5 + barWidth / 2 + pos * CheckerSize + BorderWidth);
        const hsize = CheckerSize * 0.4;

        html.push(`<rect x="${cx - hsize}" y="${-hsize}" width="${hsize * 2}" height="${hsize * 2}" ry="${BorderWidth * 3}" class="${bem('dice')}"/>`);

        function dot(x, y) {
            html.push(`<circle cx="${cx + x * 10}" cy="${y * 10}" r="${CheckerSize / 12}" class="${bem('dice-dot')}" />`);
        }

        (value & 1) && dot(0, 0);
        (value & 6) && dot(-1, -1) | dot(1, 1);
        (value & 4) && dot(-1, 1) | dot(1, -1);
        (value == 6) && dot(-1, 0) | dot(1, 0);
    }

    function home(edge, count) {
        const x = boardWidth + barWidth + BorderWidth / 2;
        const y = edge * pointHeight;
        const hsize = CheckerSize * 0.45;
        const vsize = CheckerSize * 0.10;
        const vstep = vsize * 2 + 4;

        for (let i = 0; i < count; i++) {
            html.push(`<rect x="${x - hsize}" y="${y - edge * (i - 1) * vstep - vsize}" width="${hsize * 2}" height="${vsize * 2}" ry="3" class="${bem('checker', edge)}"/>`);
        }

        count && html.push(`<text x="${x}" y="${y - edge * count * vstep}" class="${bem('text')}">${count}</text>`);
    }

    function cube(edge, value) {
        const size = Math.round(CheckerSize * 0.4);
        const cx = -(boardWidth + barWidth + BorderWidth / 2);
        const cy = edge * (pointHeight - CheckerSize * 0.3 - size);

        html.push(`<rect x="${cx - size}" y="${cy - size}" width="${size * 2}" height="${size * 2}" ry="4" class="${bem('cube')}"/>`);
        text(cx, cy, value);
    }

    function score(player, score, matchlen) {
        const mod = (matchlen > 10) && 'small';
        const x = -(boardWidth + barWidth + BorderWidth / 2);
        const y = player * (pointHeight + CheckerSize * 0.2);

        text(x, y, `${score}/${matchlen}`, mod);
    }

    function pipcount(player, count) {
        text(0, player * (pointHeight + CheckerSize * 0.2), count);
    }

    function turn(player) {
        const r = CheckerSize / 5;
        const x = boardWidth + barWidth + BorderWidth / 2;
        const y = player * (boardHeight / 2 + BorderWidth*2 + r);

        html.push(`<circle cx="${x}" cy="${y}" r="${r}" class="${bem('checker', player)}" />`);
    }

    function xgid(xgid) {
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
                checker(point, count, player);
            }
        }

        // console.log(pips[[White]], checkers[Black]*25-pips[[Black]]);

        home(White, 15-checkers[White]);
        home(Black, 15-checkers[Black]);

        pipcount(White, pips[White]);
        pipcount(Black, checkers[Black]*25-pips[Black]);

        // Cube
        const cubeValue = token[1] || 6; // Defaults to 2^6=64
        const cubePosition = token[2];

        cube(cubePosition, 1 << cubeValue);

        // Turn
        const player = token[3];
        turn(player);

        // Dice
        const diceValue = token[4];

        if(diceValue >= 11 && diceValue <= 66) {
            dice(Math.floor(diceValue / 10), 0);
            dice(diceValue % 10, 1);
        }

        // Match information
        const matchLength = token[8];

        if(matchLength > 0) {
            score(White, token[5], matchLength);
            score(Black, token[6], matchLength);
        }
    }

    const scale = 1;

    html.push(`<svg width="${viewAreaWidth * scale}" height="${fullBoardHeight * scale}" viewBox="${-viewAreaWidth / 2} ${-fullBoardHeight / 2} ${viewAreaWidth} ${fullBoardHeight}" class="bgdiagram">`);

    rect(-fullBoardWidth / 2, -boardHeight / 2, fullBoardWidth, boardHeight, bem('board')); // Full board
    rect(-barWidth / 2, -boardHeight / 2, barWidth, boardHeight); // Bar
    rect(-fullBoardWidth / 2, -boardHeight / 2, sideWidth, boardHeight); // Left side
    rect(fullBoardWidth / 2 - sideWidth, -boardHeight / 2, sideWidth, boardHeight); // Right side

    for (let p = 1; p <= 24; p++) {
        point(p);
    }

    // checker(6, 5, 1);
    // checker(8, 3, 1);
    // checker(13, 8, 1);
    // checker(24, 2, 1);

    // checker(1, 2, Black);
    // checker(12, 5, Black);
    // checker(17, 3, Black);
    // checker(19, 10, Black);

    // cube(0, 64);
    // cube(1, 2);
    // cube(-1, 4);

    // home(1, 15);
    // home(-1, 9);

    // dice(1, -2);
    // dice(2, -1);
    // dice(3, 0);
    // dice(4, 1);
    // dice(5, 2);
    // dice(6, 3);

    // bar(White, 1);
    // bar(Black, 2);

    // xgid('XGID=-a-B--E-B-a-dDB--b-bcb----:1:1:-1:63:0:0:0:3:8');
    xgid('XGID=ab----D-C---cD---c-d----AB:0:0:1:52:3:2:0:7:10'); // B:160 / W:174

    // const pr = 10;
    // const ppos = boardHeight / 2 + BorderWidth * 2 + 1 + pr;
    // html.push(`<circle cx="${boardWidth + barWidth + BorderWidth}" cy="${-ppos}" r="${10}" class="circle black" />`);
    // html.push(`<circle cx="${boardWidth + barWidth + BorderWidth}" cy="${+ppos}" r="${10}" class="circle white" />`);

    // html.push(`<text x="${-357}" y="${-260}" class="${bem('text', 'small')}">11/15</text>`);

    // html.push(`<text x="${0}" y="${boardHeight / 2 - 15}" class="${bem('text')}">167</text>`);

    html.push(`</svg>`);

    document.getElementById('board').innerHTML = html.join('');
}
