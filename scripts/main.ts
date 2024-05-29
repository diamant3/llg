import Konva from "konva";

import { createWorker } from "tesseract.js";

const width = window.innerWidth;
const height = window.innerHeight;

const res = document.getElementById('result');
const select = document.getElementById('tool');
const eraseAll = document.getElementById('eraseAllBtn');

const stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
});

const layer = new Konva.Layer();

let isPaint = false;
let mode = 'brush';
let lastLine: Konva.Line;

stage.on('mousedown touchstart', function (e) {
    stage.add(layer);
    isPaint = true;
    let pos = stage.getPointerPosition();
    lastLine = new Konva.Line({
        stroke: '#000000',
        strokeWidth: 12,
        globalCompositeOperation: mode === 'brush' ? 'source-over' : 'destination-out',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y, pos.x, pos.y],
    });

    layer.add(lastLine);
});

async function core() {
    const worker = await createWorker("eng", 1);
    const image = await stage.toImage({ pixelRatio: 2 });

    const { data: { text } } = await worker.recognize(image);
    res.innerHTML = text;
    await worker.terminate();
}

stage.on('mouseup touchend', function () {
    isPaint = false;

    core();
});

stage.on('mousemove touchmove', function (e) {
    if (!isPaint) {
        return;
    }

    e.evt.preventDefault();

    const pos = stage.getPointerPosition();
    const newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);
});

select.addEventListener('change', function () {
    mode = select.value;
});

eraseAll.addEventListener('click', function () {
    res.innerHTML = "";
    layer.destroy();
});