import xs from 'xstream';
import { div } from '@cycle/dom';

// Components
import makeAddObserverButton from '../components/AddObserver';

function intent(domSource) {
  return {
  };
}

function addObserverReducer() {
  return (prevState) => ({
    ...prevState,
    page: 'CONNECT',
  });
}

function render(sources) {
  const [state, children] = sources;

  return div('.main', [...children]);
}

function view(state$, children$) {
  return xs.combine(state$, children$).map(render);
}

function MainPage(sources) {
  const { DOM } = sources;

  const addObserverSinks = makeAddObserverButton(sources);

  const actions = intent(DOM);
  const childrenDom$ = addObserverSinks.DOM.map((vdom) => [vdom]);

  const vdom$ = view(sources.store.stream, childrenDom$);

  // sinks
  return {
    DOM: vdom$,
    store: addObserverSinks.click.map(addObserverReducer),
    canvas: xs.empty(),
  };
}

export default MainPage;
