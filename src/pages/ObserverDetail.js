import xs from 'xstream';
import * as R from 'ramda';
import { div, canvas, span, input } from '@cycle/dom';
import QRCode from 'qrcode';

// drivers
import { drawCommand } from '../drivers/Canvas';

function intent(domSource) {
  return {
  };
}

function model(actions, store$) {
  return store$; // xs.combine(actions.canvas$, store$);
}

function renderParameterNumber(label, id, min, max, value, step) {
  return div('.parameterItem', [
    span(label),
    input(id, { attrs: { type: 'number', min, max, value, step } }),
  ]);
}

function view(state$) {
  return state$.debug()
    .mapTo(div('.detail', [
      canvas('#detail-canvas'),
      div('#parametersMenu', [
        renderParameterNumber('Min Marker Distance', 'min-marker-dist', 1, 50, 10, 1),
        renderParameterNumber('Min Marker Perimeter', 'min-marker-perim', 0.01, 0.99, 0.2, 0.01),
        renderParameterNumber('Max Marker Perimeter', 'max-marker-perim', 0.01, 0.99, 0.8, 0.01),
        renderParameterNumber('Size After Perspective Removal', 'size-after-p-removal', 1, 200, 49, 1),
      ]),
    ]));
}

function ObserverDetail(sources) {
  const { DOM, store } = sources;

  const actions = intent(DOM);
  const state$ = model(actions, store.stream);
  const vdom$ = view(state$);

  // sinks
  return {
    DOM: vdom$,
    canvas: xs.empty(),
  };
}

export default ObserverDetail;
