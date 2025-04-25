# BgDiagram

**BgDiagram** is a JavaScript tool for drawing annotated backgammon diagrams in SVG.

It offers:
- A low-level API (`BgDiagramBuilder`)
- A high-level component (`BgDiagram`) that works directly with XGID positions.

You can [try an interactive demo here](https://ascottix.github.io/bgdiagram/bgdiagram_demo.html).

## Installation

Add the following tags to your HTML:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ascottix/bgdiagram@v1.0.2/dist/bgdiagram.min.css">
<script src="https://cdn.jsdelivr.net/gh/ascottix/bgdiagram@v1.0.8/dist/bgdiagram.min.js"></script>
```

If you want to use the available themes, also include:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ascottix/bgdiagram@v1.0.8/dist/bgdiagram_themes_base.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ascottix/bgdiagram@v1.0.8/dist/bgdiagram_themes_pastels.min.css">
```

## Usage

Import `BgDiagram` and use the static method `fromXgid` to convert an XGID position into SVG:

```js
import { BgDiagram } from 'bgdiagram.js';

const svg = BgDiagram.fromXgid(
  'XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:0:10',
  { homeOnLeft: true }
);
```

See below for the extended XGID syntax and additional options.

## Annotations

Annotations allow you to add arrows, text, and shapes to diagrams.

**BgDiagram** supports annotations embedded directly within XGID strings, making it easy to keep a position and its annotations together.

Supported types:
- **Moves**: Standard notation (e.g., `6/5(2)`, `bar/21`, `5/off`)
- **Arrows**: `A` followed by two points
- **Double arrows**: `D` followed by two points
- **Polygons**: `P` followed by a list of points
- **Text**: `T` followed by a point and then the text

### Point format

Each point consists of two numbers separated by a comma:
- First number:
  - `0`: top player's bar
  - `1-24`: board points
  - `25`: bottom player's bar
- Second number:
  - Vertical offset in checker-size increments (0 to 10):
    - `0`: first checker
    - `1`: second checker
    - `4`: fifth checker
    - `10`: eleventh checker (aligned with the opposite point)

Points in a list are separated by dashes, for example: `1,2-3,4-5,6`.

The center of the board is at `(0,4.5)`.

### Move suffixes

Moves can include evaluation suffixes, which will be mapped to CSS classes:
- `!!` Best move (`best`)
- `!` Good move (`good`)
- `?` Mistake (`error`)
- `??` Blunder (`blunder`)

The [interactive demo gallery](https://ascottix.github.io/bgdiagram/bgdiagram_demo.html) contains several examples you can modify live. It’s easy to understand after a few experiments.

Example diagram:

<img src="https://ascottix.github.io/bgdiagram/bgdiagram_ex1.png" width="386">

Annotations used:
- Bottom triangle: `P6,0-6,3-3,0`
- Top rectangle: `P19,0-19,1-23,1-23,0`
- Bottom arrow: `A5,4-5,3`
- Top arrow: `A21,3-21,2`
- Text label: `T0,4.5-Marked point x 10`

### Options via annotations

A special annotation type `O` allows overriding diagram options:
- `n-`: hides point numbers
- `p-`: hides pipcount indicators

Each annotation can specify one option. To combine multiple options, simply add multiple annotations. Example:

```
:Op-:On-
```

hides both pipcounts and point numbers.

## Customization

Diagrams can be fully styled with CSS.

Several example themes are provided, and it is fairly easy to create new themes.

**Diagram builder options**:
- `width`: Diagram width (default: unset)
- `height`: Diagram height (default: unset)
- `homeOnLeft`: Places the home/bearoff side on the left (default: `false`)
- `swapColors`: Swaps the players' checker colors
- `compact`: Shows only the board, without extras
- `turnIndicatorMode`:
  - *Unset*: Automatically adjusts based on `compact`
  - `0`: Circle indicator outside the board (home side)
  - `1`: Arrow indicator on the bar (overlaps pipcount)
  - `2`: Arrow indicator on the cube side

Width and height can be numbers (e.g., `500`) or strings (e.g., `'100%'`).
Often, it's better to leave them unset and control the SVG size using CSS.

## License

MIT License.
