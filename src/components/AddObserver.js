import xs from 'xstream';
import { button } from '@cycle/dom';


function intent(domSource) {
  return {
    click$: domSource.select('#add-observer')
      .events('click')
      .mapTo(true),
  };
}

function view() {
  return xs.of(button('#add-observer', '+'));
}

function AddObserver(sources) {
  const { DOM } = sources;

  const actions = intent(DOM);
  const vdom$ = view();

  // sinks
  return {
    DOM: vdom$,
    click: actions.click$, // Maybe have the model function gen an id, or trigger a request
  };
}

export default AddObserver;
