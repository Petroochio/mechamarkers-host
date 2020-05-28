import Peer from 'peerjs';
import R from 'ramda';

const MESSAGE_TYPES = {
  SET_HOST: 'SET_HOST',
  MARKER_DATA: 'MARKER_DATA',
  VIDEO_DATA: 'VIDEO_DATA',
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

let currentPeer;
let prevTime = 0;

window.onload = () => {
  clientView = document.querySelector('#temp-client-view');
  canvas = document.querySelector('#temp-marker-canvas');
  overlayCtx = canvas.getContext('2d');

  const peer = new Peer('beholder-host', {
    secure: true,
    host: 'beholder-server.herokuapp.com',
    path: '/peerapp',
  });
  peer.on('open', (id) => {
    console.log(`Peer id is: ${id}`);
  });

  peer.on('connection', (conn) => {
    currentPeer = conn;
    conn.on('data', (msg) => {
      // console.log(data);
      conn.send('thanks');
      let currentTime;
      let dt;
      // const message = JSON.parse(data);
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
          console.log(dt / 1000);
          prevTime = currentTime;
          drawMarkers(overlayCtx, msg.data);
          break;
        default: break;
      }
    });
  });
};
