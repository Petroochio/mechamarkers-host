import xs from 'xstream';
import throttle from 'xstream/extra/throttle'
import * as R from 'ramda';
import { div, canvas } from '@cycle/dom';


// Components
import makeAddObserverButton from '../components/AddObserver';
import { clearListCommand, drawCommand } from '../drivers/Canvas';

function intent(domSource) {
  return {
    previewClick$: domSource.select('.preview-canvas').events('click'),
  };
}

function addObserverReducer() {
  return (prevState) => ({
    ...prevState,
    page: 'CONNECT',
  });
}

function renderObserver(o) {
  return canvas(`#c-${o.id}.preview-canvas`, { attrs: { width: 150, height: 150 } });
}

function render(sources) {
  const [state, children] = sources;


  const observers = R.values(state.observers).map(renderObserver);
  return div('.main', [...observers, ...children]);
}

function view(state$, children$) {
  return xs.combine(state$, children$).map(render);
}

function drawObserver(ctx, o) {
  const { markers } = o;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 150, 150);

  ctx.fillStyle = 'white';
  markers.forEach((m) => {
    ctx.beginPath();
    ctx.moveTo(m.corners[0].x / 2, m.corners[0].y / 2);
    ctx.lineTo(m.corners[1].x / 2, m.corners[1].y / 2);
    ctx.lineTo(m.corners[2].x / 2, m.corners[2].y / 2);
    ctx.lineTo(m.corners[3].x / 2, m.corners[3].y / 2);
    ctx.closePath();
    ctx.fill();
  });
}

function drawAllObservers(observers) {
  return R.values(observers).map((o) => {
    const canvasID = `#c-${o.id}`;
    const drawFunc = (ctx) => {
      drawObserver(ctx, o);
    };

    return drawCommand(canvasID, drawFunc);
  });
}

function MainPage(sources) {
  const { DOM, store } = sources;

  const addObserverSinks = makeAddObserverButton(sources);

  const actions = intent(DOM);
  const childrenDom$ = addObserverSinks.DOM.map((vdom) => [vdom]);
  const vdom$ = view(sources.store.stream, childrenDom$);

  const focusReducer$ = actions.previewClick$
    .map(({ target }) => target.id.split('-')[1])
    .map((id) => (s) => ({ ...s, focusedObserver: id, page: 'DETAIL' }));

  const reducer$ = xs.merge(
    addObserverSinks.click.map(addObserverReducer),
    focusReducer$
  );

  // observer canvases. state$.map(xs.of()).flatten()
  const previewDraw$ = store.stream // .compose(throttle(500))
    .filter(R.pipe(R.prop('page'), R.equals('MAIN')))
    .map(R.prop('observers'))
    .map(drawAllObservers)
    .map((o) => xs.fromArray(o))
    .flatten();

  const clearCanvas$ = xs.merge(actions.previewClick$, addObserverSinks.click)
    .mapTo(clearListCommand());

  // sinks
  return {
    DOM: vdom$,
    store: reducer$,
    canvas: xs.merge(previewDraw$, clearCanvas$),
  };
}

export default MainPage;
