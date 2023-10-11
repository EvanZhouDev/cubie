const normalize = (f, a) => Math.round(f(0.5 * a * Math.PI));
const sin = (a) => normalize(Math.sin, a), cos = (a) => normalize(Math.cos, a), { abs, sign } = Math;

const rx = (T, x1 = 1, x2 = x1) => [1, 0, 0, 0, cos(T), -sin(T), 0, sin(T), cos(T), 0, x1, x2],
    ry = (T, y1 = 1, y2 = y1) => [cos(T), 0, sin(T), 0, 1, 0, -sin(T), 0, cos(T), 1, y1, y2],
    rz = (T, z1 = 1, z2 = z1) => [cos(T), -sin(T), 0, sin(T), cos(T), 0, 0, 0, 1, 2, z1, z2];

const mult = (r, t) => [0, 1, 2].map(i => [0, 1, 2].reduce((s, j) => s + r[i * 3 + j] * t[j], 0));

class Cube {
    pieces = [];

    constructor() {
        const offsets = [-1, 0, 1];
        
        offsets.forEach(x => offsets.forEach(y => offsets.forEach(z =>
            (x || y || z) && this.pieces.push([x, y, z].map((x, i) => x * (x + 3 + i * 4) / 2)))))
    }

    turn(R) {
        const [axis, start, end] = R.slice(9);

        for (let i in this.pieces) {
            const piece = this.pieces[i], pos = sign(piece[axis]);
            if (pos >= start && pos <= end) this.pieces[i] = mult(R, piece);
        }
    }

    flatten() {
        const flattened = ["1,0,0", "-1,0,0", "0,1,0", "0,-1,0", "0,0,1", "0,0,-1", "0,0,0"]
            .reduce((acc, piece) => ({ ...acc, [piece]: Array(3).fill().map(_ => Array(3)) }), {});

        for (const p of this.pieces) {
            const [x, y, z] = p.map(x => sign(x)), [cx, cy, cz] = p;
            flattened[String([x, 0, 0])][abs(y - 1)][abs(z - sign(x))] = abs(cx);
            flattened[String([0, y, 0])][abs(z + sign(y))][abs(x + 1)] = abs(cy);
            flattened[String([0, 0, z])][abs(y - sign(z))][abs(x + sign(z))] = abs(cz);
        }

        delete flattened[String([0, 0, 0])]
        return flattened;
    }
}