const fs = require('fs');

function testSpawn() {
    // emulate spawn logic
    const availableDirs = [0, 1, 2, 3];
    // filter
    // no opponent, availableDirs = [0, 1, 2, 3]

    // shuffle
    for (let i = availableDirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableDirs[i], availableDirs[j]] = [availableDirs[j], availableDirs[i]];
    }

    const centerX = 10, centerY = 10, zoneStart = 8, zoneEnd = 12, shapeW = 2, shapeH = 2;

    let finalDir = availableDirs[0];
    let finalSpawn = null;
    let finalDx = 0, finalDy = 0;

    const overlap = true; // assume TRUE for ALL checks

    for (const dir of availableDirs) {
        let dx = 0, dy = 0;
        let sx, sy;

        if (dir === 0) {
            dy = -1;
            sx = centerX - Math.floor(shapeW / 2);
            sy = zoneStart;
        } else if (dir === 1) {
            dx = 1;
            sx = zoneEnd - shapeW;
            sy = centerY - Math.floor(shapeH / 2);
        } else if (dir === 2) {
            dy = 1;
            sx = centerX - Math.floor(shapeW / 2);
            sy = zoneEnd - shapeH;
        } else if (dir === 3) {
            dx = -1;
            sx = zoneStart;
            sy = centerY - Math.floor(shapeH / 2);
        }

        if (!overlap) {
            finalDir = dir;
            finalSpawn = { x: sx, y: sy };
            finalDx = dx;
            finalDy = dy;
            break;
        }
    }

    if (!finalSpawn) {
        finalDir = availableDirs[0];
        if (finalDir === 0) { finalDy = -1; finalSpawn = { x: centerX - Math.floor(shapeW / 2), y: zoneStart }; }
        else if (finalDir === 1) { finalDx = 1; finalSpawn = { x: zoneEnd - shapeW, y: centerY - Math.floor(shapeH / 2) }; }
        else if (finalDir === 2) { finalDy = 1; finalSpawn = { x: centerX - Math.floor(shapeW / 2), y: zoneEnd - shapeH }; }
        else { finalDx = -1; finalSpawn = { x: zoneStart, y: centerY - Math.floor(shapeH / 2) }; }
    }

    return { dx: finalDx, dy: finalDy };
}

let bothZero = 0;
for (let i = 0; i < 10000; i++) {
    const res = testSpawn();
    if (res.dx === 0 && res.dy === 0) {
        bothZero++;
    }
}
console.log("Both Zero cases:", bothZero);
