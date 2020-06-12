import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import * as R from 'ramda';

export const MESSAGE_TYPES = {
  SET_CAMERA_PARAMS: 'SET_CAMERA_PARAMS',
  SET_HOST: 'SET_HOST',
  ASSIGN_HOST_KEY: 'ASSIGN_HOST_KEY', // received by new host
  CONNECT_TO_HOST: 'CONNECT_TO_HOST',
  MARKER_DATA: 'MARKER_DATA',
  VIDEO_DATA: 'VIDEO_DATA',
};

export function makeMessage(type, data) {
  return JSON.stringify({
    type,
    data,
  });
}

// I'm bootstraping URL for this right now
export function makeBeholderServerDriver() {
  // const socket = new WebSocket('ws://localhost:3000');
  const socket = new WebSocket('wss://beholder-server.herokuapp.com');
  // Convert to binary once data channel is working
  // socket.binaryType = 'arraybuffer';
  let isConnected = false;
  const messageBacklog = [];

  // Connection opened
  socket.addEventListener('open', () => {
    isConnected = true;
    socket.send(makeMessage(MESSAGE_TYPES.SET_HOST, ''));
    // messageBacklog.forEach((m) => socket.send(m));
    // messageBacklog.splice(0, messageBacklog.length);
  });

  // for debugging
  // socket.addEventListener('message', (event) => {
  //   console.log('msg', event);
  // });

  // Driver function
  return (message$) => {
    message$.addListener({
      next: (message) => {
        if (isConnected) socket.send(message);
        else messageBacklog.push(message);
      },
      error: () => {},
      complete: () => {},
    });

    const receive$ = xs.create({
      start: (listener) => {
        socket.addEventListener('message', (event) => {
          // console.log('msg', event);
          listener.next(JSON.parse(event.data));
        });
      },
      stop: () => {},
    });

    return {
      select: (type) => adapt(receive$.filter((e) => e.type === type).map(R.prop('data'))),
    };
  };
}
