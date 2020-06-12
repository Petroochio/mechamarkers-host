import xs from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';

export function drawCommand(target, renderFunc) {
  return {
    target,
    type: 'DRAW',
    render: renderFunc,
  };
}

export function clearListCommand() {
  return {
    type: 'CLEAR_CANVAS_LIST',
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
              if (document.querySelector(command.target)) {
                ctxList[command.target] = {};
                ctxList[command.target].canvas = document.querySelector(command.target);
                ctxList[command.target].ctx = ctxList[command.target].canvas.getContext('2d');
              } else {
                // Bail when I can't find the canvas
                return;
              }
            }

            command.render(ctxList[command.target].ctx, ctxList[command.target].canvas);
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
