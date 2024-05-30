import Konva from "konva";

import { createWorker, createScheduler } from "tesseract.js";

const width = window.innerWidth;
const height = window.innerHeight;

const res = document.getElementById('result');
const select = document.getElementById('tool');
const eraseAll = document.getElementById('eraseAllBtn');

const scheduler = createScheduler();

const stage = new Konva.Stage({
    container: 'container',
    width: width,
    height: height
});

const layer = new Konva.Layer();

let isPaint: boolean = false;
let mode: string = 'brush';
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

    const gs_image = new Konva.Image({
        image: stage.toCanvas(),
        draggable: false,
    });
    gs_image.cache();
    gs_image.filters([Konva.Filters.Grayscale]);

    layer.add(gs_image);
});

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

const workerGen = async () => {
    const worker = await createWorker('eng');
    scheduler.addWorker(worker);
}

const core = async () => {
    const workerN = 4;
    const workerArr = Array(workerN);
    const recogJob = 20;
    const image = await stage.toImage({ pixelRatio: 2 });

    for (let worker = 0; worker < workerN; worker++) {
        workerArr[worker] = workerGen();
    }
    await Promise.all(workerArr);

    await Promise.all(Array(recogJob).fill(0).map(() => (
        scheduler.addJob('recognize', image).then((result) => res.innerHTML = result.data.text)
    )))
    await scheduler.terminate();
};