let normalize = (f, a) => Math.round(f(0.5 * a * Math.PI));
let sin = (a) => normalize(Math.sin, a), cos = (a) => normalize(Math.cos, a), { abs, sign } = Math;

let newSquare2d = (n) => Array.from(Array(n), () => new Array(n));
let rx = (T, x1 = 1, x2 = x1) => [
    [0, x1, x2],
    [1, 0, 0, 0, cos(T), -sin(T), 0, sin(T), cos(T)],
    [1, 0, 0, 0, 1 - T % 2, T % 2, 0, T % 2, 1 - T % 2]
];
let ry = (T, y1 = 1, y2 = y1) => [
    [1, y1, y2],
    [cos(T), 0, sin(T), 0, 1, 0, -sin(T), 0, cos(T)],
    [1 - T % 2, 0, T % 2, 0, 1, 0, T % 2, 0, 1 - T % 2]
];
let rz = (T, z1 = 1, z2 = z1) => [
    [2, z1, z2],
    [cos(T), -sin(T), 0, sin(T), cos(T), 0, 0, 0, 1],
    [1 - T % 2, T % 2, 0, T % 2, 1 - T % 2, 0, 0, 0, 1]
];

const mult = (r, t) => [0, 1, 2].map(i => [0, 1, 2].reduce((s, j) => s + r[i * 3 + j] * t[j], 0));

class Cube {
    pieces = [];
    constructor() {
        const offsets = [-1, 0, 1];
        for (let x of offsets) {
            for (let y of offsets) {
                for (let z of offsets) {
                    if (x || y || z) this.pieces.push([[x, y, z], [x + 1, y + 4, z + 7]]);
                }
            }
        }
    }

    rotate(R) {
        let [meta] = R;
        for (let piece of this.pieces) {
            let [pos] = piece;
            if (pos[meta[0]] >= meta[1] && pos[meta[0]] <= meta[2]) {
                [0, 1].forEach(i => piece[i] = mult(R[i + 1], piece[i]))
            }
        }
    }

    flatten() {
        let flattened = {};

        for (const face of ["1,0,0", "-1,0,0", "0,1,0", "0,-1,0", "0,0,1", "0,0,-1", "0,0,0"]) {
            flattened[face] = Array(3).fill().map(_ => Array(3))
        };

        for (const [p, [cx, cy, cz]] of this.pieces) {
            const [x, y, z] = p;

            flattened[String([x, 0, 0])][abs(y - 1)][abs(z - sign(x))] = cx;
            flattened[String([0, y, 0])][abs(z - sign(-y))][abs(x + 1)] = cy;
            flattened[String([0, 0, z])][abs(y - sign(z))][abs(x + sign(z))] = cz;
        }

        delete flattened[String([0, 0, 0])]
        return flattened;
    }
}