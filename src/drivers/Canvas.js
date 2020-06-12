import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';

export function drawCommand(target, renderFunc) {
  return {
    target,
    type: 'DRAW',
    render: renderFunc,
  };
}

export function clearListCommand(target, renderFunc) {
  return {
    target,
    type: 'CLEAR_CANVAS_LIST',
    render: renderFunc,
  };
}

export function makeCanvasDriver() {
  let ctxList = {};

  // Driver function
  return (render$) => {
    render$.addListener({
      next: (command) => {
        switch (command.type) {
          case 'CLEAR_CANVAS_LIST':
            ctxList = {};
            break;
          case 'DRAW':
            if (!ctxList[command.target]) {
              ctxList[command.target] = {};
              ctxList[command.target].canvas = document.querySelector(command.target);
              ctxList[command.target].ctx = ctxList[command.target].canvas.getContext('2d');
            }

            command.render(ctxList[command.target].ctx);
            break;
          default:
            console.warn('Unable to parse render command: ', command);
            break;
        }
      },
      error: () => {},
      complete: () => {},
    });

    // This can be am animation frame stream, with dt
    const frame$ = xs.create({
      start: (listener) => {
        listener.next('test render');
      },
      stop: () => {},
    });

    return adapt(frame$);
  };
}
