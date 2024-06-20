import Konva from "konva";

import { createWorker, createScheduler } from "tesseract.js";

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
stage.add(layer);

let isPaint: boolean = false;
let mode: string = 'brush';
let lastLine: Konva.Line;

stage.on('mousedown touchstart', function (e) {
    isPaint = true;
    let pos = stage.getPointerPosition();
    lastLine = new Konva.Line({
        stroke: '#000000',
        strokeWidth: 14,
        globalCompositeOperation: mode === 'brush' ? 'source-over' : 'destination-out',
        lineCap: 'round',
        lineJoin: 'round',
        points: [pos.x, pos.y, pos.x, pos.y],
    });

    layer.add(lastLine);
});

stage.on('mouseup touchend', function () {
    isPaint = false;
    
    // disable grayscale conversion
    // const gs_image = new Konva.Image({
    //     image: stage.toCanvas(),
    //     draggable: false,
    // });
    // gs_image.cache();
    // gs_image.filters([Konva.Filters.Grayscale]);

    // layer.add(gs_image);

    (async () => {
        const image = await stage.toImage();
        const worker = await createWorker('eng');
        const ret = await worker.recognize(image);
        res.innerHTML = ret.data.text;
        await worker.terminate();
    })();
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
    layer.destroyChildren();
});