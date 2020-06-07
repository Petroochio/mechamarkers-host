import Peer from 'peerjs';
import * as R from 'ramda';

const MESSAGE_TYPES = {
  SET_HOST: 'SET_HOST',
  MARKER_DATA: 'MARKER_DATA',
  VIDEO_DATA: 'VIDEO_DATA',
  SET_CAMERA_PARAMS: 'SET_CAMERA_PARAMS',
};

let clientView;
let canvas;
let overlayCtx;

function drawMarkers(ctx, markers) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 3;

  markers.forEach((m) => {
    const { center, corners } = m;

    ctx.strokeStyle = 'red';
    ctx.beginPath();

    corners.forEach((c, i) => {
      ctx.moveTo(c.x, c.y);
      const c2 = corners[(i + 1) % corners.length];
      ctx.lineTo(c2.x, c2.y);
    });

    ctx.stroke();
    ctx.closePath();

    // draw first corner
    ctx.strokeStyle = 'green';
    ctx.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);

    ctx.strokeStyle = 'yellow';
    ctx.strokeRect(center.x - 2, center.y - 2, 4, 4);
  });
}

let prevTime = 0;

window.onload = () => {
  clientView = document.querySelector('#temp-client-view');
  canvas = document.querySelector('#temp-marker-canvas');
  overlayCtx = canvas.getContext('2d');

  const socket = new WebSocket('wss://beholder-server.herokuapp.com');

  // Get data from param inputs
  function setParam(name, value) {
    const p = {};
    p[name] = value;
    socket.send(JSON.stringify({ type: MESSAGE_TYPES.SET_CAMERA_PARAMS, data: p }));
  }
  R.forEach((el) => {
    el.addEventListener('change', (e) => setParam(e.target.name, e.target.value));
  }, document.querySelectorAll('input'));

  socket.onopen = (event) => {
    console.log('connected: ', event);
    socket.send(JSON.stringify({ type: MESSAGE_TYPES.SET_HOST }));
  };

  socket.onmessage = (message) => {
    // console.log(data);
    let currentTime;
    let dt;

    const msg = JSON.parse(message.data);
    // console.log('got some data', msg.type);
    switch (msg.type) {
      case MESSAGE_TYPES.VIDEO_DATA:
        canvas.width = msg.data.width;
        canvas.height = msg.data.height;
        clientView.src = msg.data.frame;
        break;
      case MESSAGE_TYPES.MARKER_DATA:
        // console.log('mark');
        currentTime = Date.now();
        dt = currentTime - prevTime;
        canvas.width = 480;
        canvas.height = 360;
        // console.log(dt / 1000); // fps for just markers
        prevTime = currentTime;
        drawMarkers(overlayCtx, msg.data);
        break;
      default: break;
    }
  };
};
