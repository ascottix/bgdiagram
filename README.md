# BgDiagram

BgDiagram is a JavaScript tool to draw annotated backgammon diagrams in SVG.

It comes with a low level API (BgDiagramBuilder) and a high level component (BgDiagram) that works with XGID positions.

You can [try an interactive version here](https://ascottix.github.io/bgdiagram/bgdiagram_demo.html).

## Annotations

Annotations can add arrows, text and shapes to a diagram.

BgDiagram supports annotation using extra fields in XGID positions. This way, it's very simple to keep a position and its annotations together.

There are several types of annotations:
- moves are expressed in the standard notation, for example: 6/5(2), bar/21, 5/off
- arrows: an 'A' followed by a list of two points
- polygons (shapes): a 'P' followed by a list of points
- text: a 'T' followed by a point and then the text

Moves can be further annotated (chess-style) adding one of these suffixes:
- !! for the best move
- ! for a good move
- ? for an error
- ?? for a blunder (big error)

If found, they are converted into CSS classes (`best`, `good`, `error`, `blunder`) that can be used to further customize the move arrows.

All points are expressed in board point coordinates, where:
- the first number is the board point from 1 to 24 or:
    - 0 for the top player bar
    - 25 for the bottom player bar
- the second number is the point height, in checker size increments, from 0 to 10 (0 is the point base, 10 is the point base of the opposite point, a typical height goes from 0 to 4)

The exact center of the board is 0,4.5.

Points in a list are separated by a dash, for example: 1,2-3,4-5,6.

The [interactive demo gallery](https://ascottix.github.io/bgdiagram/bgdiagram_demo.html) contains several examples of annotated positions. You can directly modify the XGID string and it will be easy to see how it works after a few experiments.

For example the diagram:

<img src="https://ascottix.github.io/bgdiagram/bgdiagram_ex1.png" width="386">

contains the following annotations:
- bottom triangle: P6,0-6,3-3,0
- top rectangle: P19,0-19,1-23,1-23,0
- bottom arrow: A5,4-5,3
- top arrow: A21,3-21,2
- text: T0,4.5-Marked point x 10

## Customizability

Diagrams can be styled using CSS.

Several themes are provided to show how it works. The most complete example is "Marina".

The diagram builder supports the following options:
- scale: the diagram scale factor (default: 1)
- flipx: if true, the bearoff side is on the left (default: false)

## License

MIT License.
