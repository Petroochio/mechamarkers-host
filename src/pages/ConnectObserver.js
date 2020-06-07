import xs from 'xstream';
import { div } from '@cycle/dom';

function intent(domSource) {
  return {
  };
}

function createObserver() {
  return {
    id: 'heh',
  };
}

function view() {
  return xs.of(div('.add', 'add'));
}

function ConnectObserver(sources) {
  const { DOM, state } = sources;

  const actions = intent(DOM);
  const vdom$ = view();

  // sinks
  return {
    DOM: vdom$,
  };
}

export default ConnectObserver;
