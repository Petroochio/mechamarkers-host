import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import * as R from 'ramda';
import { div, canvas, span, input, button } from '@cycle/dom';

// drivers
import { drawCommand, clearListCommand } from '../drivers/Canvas';
import { makeMessage, MESSAGE_TYPES } from '../drivers/BeholderServer';

const C_WIDTH = 480;
const C_HEIGHT = 360;

function intent(domSource) {
  return {
    backClick$: domSource.select('.back').events('click'),
    paramChange$: domSource.select('.parameterItem').select('input').events('change'),
  };
}

function model(actions, store$) {
  return store$; // xs.combine(actions.canvas$, store$);
}

function renderParameterNumber(label, name, min, max, value, step) {
  return div('.parameterItem', [
    span(label),
    input({ attrs: { name, type: 'number', min, max, value, step } }),
  ]);
}

function view(state$) {
  return xs.of(div('.detail', [
    canvas('#detail-canvas', { attrs: { width: C_WIDTH, height: C_HEIGHT } }),
    div('#parametersMenu', [
      renderParameterNumber('Min Marker Distance', 'MIN_MARKER_DISTANCE', 1, 50, 10, 1),
      renderParameterNumber('Min Marker Perimeter', 'MIN_MARKER_PERIMETER', 0.01, 0.99, 0.2, 0.01),
      renderParameterNumber('Max Marker Perimeter', 'MAX_MARKER_PERIMETER', 0.01, 0.99, 0.8, 0.01),
      renderParameterNumber('Size After Perspective Removal', 'SIZE_AFTER_PERSPECTIVE_REMOVAL', 1, 200, 49, 1),
      button('.back', 'back'),
    ]),
  ]));
}

function drawPreview(ctx, markers) {
  ctx.fillStyle = 'white';
  markers.forEach((m) => {
    ctx.beginPath();
    ctx.moveTo(m.corners[0].x, m.corners[0].y);
    ctx.lineTo(m.corners[1].x, m.corners[1].y);
    ctx.lineTo(m.corners[2].x, m.corners[2].y);
    ctx.lineTo(m.corners[3].x, m.corners[3].y);
    ctx.closePath();
    ctx.fill();
  });
}

function ObserverDetail(sources) {
  const { DOM, store } = sources;

  const actions = intent(DOM);
  const state$ = model(actions, store.stream);
  const vdom$ = view(state$);

  const draw$ = state$.filter(R.pipe(R.prop('page'), R.equals('DETAIL')))
    .map(({ focusedObserver, observers }) => (ctx) => {
      ctx.fillStyle = 'black';
      ctx.fillRect(-1, -1, C_WIDTH + 2, C_HEIGHT + 2);
      drawPreview(ctx, observers[focusedObserver].markers);
    })
    .map((f) => drawCommand('#detail-canvas', f));

  const backNavReducer$ = actions.backClick$.mapTo((s) => ({ ...s, page: 'MAIN' }));
  const clearCanvas$ = actions.backClick$.mapTo(clearListCommand());

  // Send param info
  const paramUpdate$ = actions.paramChange$.compose(sampleCombine(state$))
    .map(([e, state]) => {
      const data = {
        hostID: state.hostID,
        observerID: state.focusedObserver,
        params: {},
      };
      data.params[e.target.name] = e.target.value;

      return makeMessage(MESSAGE_TYPES.SET_CAMERA_PARAMS, data);
    });

  // sinks
  return {
    DOM: vdom$,
    canvas: xs.merge(draw$, clearCanvas$),
    store: backNavReducer$,
    beholder: paramUpdate$,
  };
}

export default ObserverDetail;
