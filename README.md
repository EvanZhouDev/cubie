# `cubie`

(Probably) the world's smallest Rubik's cube simulator

## How it Works

A typical way to simulate a Rubik's cube is by storing each face of the Rubik's cube, and modifying each "sticker" on that face individually during a turn. However, I went with an approach that better mimics how a Rubik's cube works in real life—storing each piece individually, and simulating turns with [3D rotation matricies](https://en.wikipedia.org/wiki/Rotation_matrix#In_three_dimensions).

I will begin by explaining the mathematical properties of the Rubik's cube, then transitioning into how I have implemented them in code.

### A Piece

A piece is made up of two vectors, the Position Vector ($\vec{p}$) and the Color Vector ($\vec{c}$).

The position vector denotes the location of the piece on the cube. The "core" of the 3x3 Rubik's cube is at $(0,0,0)$, and the each piece looks something like this.

```math
\mathbf{p} = \begin{bmatrix}
x \\
y \\
z
\end{bmatrix}, \quad \text{where } x, y, z \in \{-1, 0, 1\}
```

Next, I assigned each of the 6 colors on the Rubik's cube a number from $0$ to $5$.

```math
\mathbf{c} = \begin{bmatrix}
c_x \\
c_y \\
c_z
\end{bmatrix}, \quad \text{where } c_x, c_y, c_z \in \{0, 1, 2, 3, 4, 5\}
```

The color associated on the $x$, $y$, and $z$ dimensions are the colors of the "stickers" on that side. Notice how each piece on the cube has at most 3 colors, so we do not have to specify 6 different colors for one piece.

It is important to note that the color on the $x$ face can be interpreted to be on both the $+x$ face and the $-x$ face, and similarly for $y$ and $z$.

#### Impact of Rotation on a Piece

Rotating a piece involves two significant parts. Transforming the Position Vector, and then the Color Vector.

The use of the 3D elemental rotation matrix to move the piece may be misleading in this case—instead, see the "rotation" as moving the piece's Position Vector, without actually rotating it. Then, we have to actually rotate the colors on it by changing the Color Vector.

##### Position:

Here are the 3 elemental rotation matricies, which is what we are using to rotate a piece by a certain amount.

```math
R_x(\theta) = \begin{bmatrix}
1 & 0 & 0\\
0 & \cos(\theta) & -\sin(\theta)\\
0 & \sin(\theta) & \cos(\theta)
\end{bmatrix}
```

```math
R_y(\theta) = \begin{bmatrix}
\cos(\theta) & 0 & \sin(\theta)\\
0 & 1 & 0\\
-\sin(\theta) & 0 & \cos(\theta)
\end{bmatrix}
```

```math
R_z(\theta) = \begin{bmatrix}
\cos(\theta) & -\sin(\theta) & 0\\
\sin(\theta) & \cos(\theta) & 0\\
0 & 0 & 1
\end{bmatrix}
```

In order to rotate our piece, we simply multiply the rotation matrix, in this example on the x-axis, to our position vector.

```math
R_x(\theta)\cdot\vec{p} = \begin{bmatrix}
1 & 0 & 0\\
0 & \cos(\theta) & -\sin(\theta)\\
0 & \sin(\theta) & \cos(\theta)
\end{bmatrix}\cdot\begin{bmatrix}
x \\
y \\
z
\end{bmatrix}
```

##### Color:

Handling the colors are a bit more complicated. Let's consider what happens to the colors on a corner piece when it is rotated. I will be refering to this changing arrangement of colors as Sticker Parity.

If a corner piece is rotated in the x-axis, notice how the sticker that was originally facing the x-axis is still facing the x-axis. However, the color that was originally facing the y-axis is now facing the z-axis. Similarly, the sticker originally facing the z-axis is now facing the y-axis.

Considering this for rotations on y and z axes, you will notice that it is always true that the sticker facing the axis you are rotating stays in that direction, while the stickers facing the other two axes will swap directions.

Note that the stickers may move from the positive side of an axis to the negative side of another axis. This is why it is important that our Color Vector contains 3 colors for each axes that is transient over both the positive and negative sides of an axes.

In order to mathematically represent this, I have created some simple transformation matrices that simply swap 2 components of a Vector. Let's call these $T$, for a general transformation.

One further note before seeing the formulas below is that if we turn the side $90\degree\cdot(2n+1) \text{ for }n\in\mathbb{N}$ the Sticker Parity rule applies. However, for any multiple of $180\degree$, the same Sticker Parity before and after _will be the same_. Thus, we will need to keep track of how many $90\degree$ rotations we are applying (Referred to hereinafter as $\alpha$, not to be confused with $\theta$), and use modulo to detect if there is Sticker Parity.

```math
T_x(\alpha) = \begin{bmatrix}
1 & 0 & 0\\
0 & 1 - \alpha\bmod2 & \alpha\bmod2\\
0 & \alpha\bmod2 & 1 - \alpha\bmod2
\end{bmatrix}
```

```math
T_y(\alpha) = \begin{bmatrix}
1 - \alpha\bmod2 & 0 & \alpha\bmod2\\
0 & 1 & 0\\
\alpha\bmod2 & 0 & 1 - \alpha\bmod2
\end{bmatrix}
```

```math
T_z(\alpha) = \begin{bmatrix}
1 - \alpha\bmod2 & \alpha\bmod2 & 0 \\
\alpha\bmod2 & 1 - \alpha\bmod2 & 0 \\
0 & 0 & 1
\end{bmatrix}
```

Similarly to the position matricies above, we simply multiply it onto our color matrix.

```math
T_x(\alpha)\cdot\vec{c} = \begin{bmatrix}
1 & 0 & 0\\
0 & 1 - \alpha\bmod2 & \alpha\bmod2\\
0 & \alpha\bmod2 & 1 - \alpha\bmod2
\end{bmatrix}\cdot\begin{bmatrix}
x \\
y \\
z
\end{bmatrix}
```

Now, let's look at how I have organized this data structure in code.

### The Cube

Let's get the logistics out of the way first.


All "angles" from this point on will be referring to a multiple of $\frac{\pi}{2}$. I have defined `sin` and `cos`'s inputs to be multiplied by $\frac{\pi}{2}$, then have the output rounded to an integer (as rounding errors occur if they don't).

Then, all matricies are flattened into an array to not make it too ugly. This means your rotation matrix will look like this:

```javascript
[1, 0, 0, 0, cos(T), -sin(T), 0, sin(T), cos(T)];
```

And your position matrix will look like this: `[1,1,1]`.

A custom matrix-multiplication method is written to matrix-multiply these arrays.

All cube logic is contained in a class called `Cube`, and each Piece is an array (no point to make it an object) that looks like this:

```javascript
[[px, py, pz], [cx, cy, cz]];
```

And these Pieces are contained in a list in the `Cube` class.

Now, for the fun part...

#### Defining a Overarching Rotation Function

To make this clean and simple, I wanted a 3 rotation functions (in 3 axes) that took the **angle of rotation**, and **number of layers**, and returned a single, clean, **matrix** (used loosely here, more like an array) that can somehow be interpreted by a **single rotating function** to rotate a piece.

It took a lot of iteration, but I eventually ended up with a function like this (example for the x-axis):

```javascript
let rx = (T, x1 = 1, x2 = x1) => [
    [0, x1, x2], // Metadata
    [1, 0, 0, 0, cos(T), -sin(T), 0, sin(T), cos(T)], // Rx(alpha)
    [1, 0, 0, 0, 1 - T % 2, T % 2, 0, T % 2, 1 - T % 2] // Tx(alpha)
];
```

The metadata is stored such that the main `Rotate` method on `Cube` is aware of what it's doing. For now, focus on the second two lines. At index 1, we see the Rotation Matrix. At index 2, we see the Color transformation matrix. Whenever a piece needs to be rotated, it's Position Vector is multiplied by index 1, and Color Vector by index 2—and that's all it takes to transform a piece.

#### Putting it All Into a Cube

Now, to make the cube class, we first initiate a total of 26 pieces ($3^3-1$) with correct positions and colors. As mentioned before, the colors are numbers, and as they are completely abstract, any simple mapping technique can work. This is how the Color Vector is defined in the code, with `x`, `y`, and `z` being the locations: `[x + 1, y + 4, z + 7]`.

Now, to turn the cube, we have to use the `metadata` line of the rotation function we defined above:

```
[axis, start, end]
```

We look at all pieces whose location on the given axis (0 is `x`, 1 is `y`, 2 is `z`) is between the `start` and `end` values. Then, we apply the rotation to that piece as shown above. That's it! (See how the math pays off?)

#### Flattening the Cube

The final step is to turn the collection of pieces into a (somewhat) human-readable object. Each face is identified with one of these strings: `["1,0,0", "-1,0,0", "0,1,0", "0,-1,0", "0,0,1", "0,0,-1"]` (a coordinate pair identifying the face axis and whether its top/bottom, left/right, or front/back—technically, the axis are all abstract, so you define what is what). Then, iterating through each face and applying a flattening transformation I won't get into too much detail in here, it is able to transform each side into a 3x3 matrix.

And that's how `cubie` works!