import xs from 'xstream';
import { run } from '@cycle/run';
import { makeDOMDriver, div } from '@cycle/dom';
import { withState } from '@cycle/state';
import * as R from 'ramda';

// pages
import makeConnectObserver from './pages/ConnectObserver';
import makeMainPage from './pages/MainPage';

function intent(domSource) {
  return {
  };
}

function model(actions, state$) {
  return state$; // xs.combine(state$, xs.of('temp'));
}

function view(model$, mainPage$, connect$) {
  return xs.combine(model$, mainPage$, connect$).map((data) => {
    const [state, mainPage, connect] = data;

    switch (state.page) {
      case 'MAIN':
        return mainPage;
      case 'CONNECT':
        return connect;
      default:
        return mainPage;
    }
  });
}

function main(sources) {
  const { DOM, state } = sources;
  const state$ = state.stream.debug();

  const actions = intent(DOM);
  const model$ = model(actions, state$);

  const pages = {
    mainPage: makeMainPage(sources),
    connectObserver: makeConnectObserver(sources),
    observerPreview: { },
  };

  const vdom$ = view(model$, pages.mainPage.DOM, pages.connectObserver.DOM);

  // Initial state
  const initReducer$ = xs.of(() => ({
    observers: [],
    page: 'MAIN',
    focusedObserver: 0,
    addID: 0,
  }));

  const reducer$ = xs.merge(initReducer$, pages.mainPage.state);

  return {
    DOM: vdom$,
    state: reducer$,
  };
}

const drivers = {
  DOM: makeDOMDriver('#app'),
};

const wrappedMain = withState(main);

run(wrappedMain, drivers);
