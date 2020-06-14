import * as R from 'ramda';
import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import { run } from '@cycle/run';
import { makeDOMDriver, div } from '@cycle/dom';
import { withState } from '@cycle/state';

// Driver
import { makeCanvasDriver } from './drivers/Canvas';
import { makeBeholderServerDriver, MESSAGE_TYPES } from './drivers/BeholderServer';

// pages
import makeConnectObserver from './pages/ConnectObserver';
import makeMainPage from './pages/MainPage';
import makeObserverDetail from './pages/ObserverDetail';

function intent(domSource) {
  return {
  };
}

function model(actions, store$) {
  return store$; // xs.combine(state$, xs.of('temp'));
}

function view(state$, mainPage$, connect$, detail$) {
  return xs.combine(state$, mainPage$, connect$, detail$).map((data) => {
    const [state, mainPage, connect, detail] = data;

    switch (state.page) {
      case 'MAIN':
        return mainPage;
      case 'CONNECT':
        return connect;
      case 'DETAIL':
        return detail;
      default:
        return mainPage;
    }
  });
}

function createObserver(observerID) {
  return {
    id: observerID,
    markers: [],
  };
}

function main(sources) {
  const { DOM, store, beholder } = sources;
  const store$ = store.stream;

  const actions = intent(DOM);
  const state$ = model(actions, store$);

  const pages = {
    mainPage: makeMainPage(sources),
    connectObserver: makeConnectObserver(sources),
    observerDetail: makeObserverDetail(sources),
  };

  const vdom$ = view(
    state$,
    pages.mainPage.DOM,
    pages.connectObserver.DOM,
    pages.observerDetail.DOM
  );

  // Initial state
  const initReducer$ = xs.of(() => ({
    observers: {},
    page: 'MAIN',
    focusedObserver: '',
    hostID: '',
  }));

  const hostIDReducer$ = beholder.select(MESSAGE_TYPES.ASSIGN_HOST_KEY)
    .map((hostID) => (state) => ({ ...state, hostID }));

  const observerConnectReducer$ = beholder.select(MESSAGE_TYPES.CONNECT_TO_HOST)
    .map(({ observerID }) => (state) => {
      // filthy dirty side effect (or rather not immutable)
      state.observers[observerID] = createObserver(observerID);
      state.focusedObserver = observerID;
      state.page = 'DETAIL';
      return { ...state }; // potential memory hang bc every update will require this
      // Apparently state streams only update when a new reference is passed
    });

  const markerReducer$ = beholder.select(MESSAGE_TYPES.MARKER_DATA)
    .compose(sampleCombine(store$))
    .filter(([_, state]) => (state.page !== 'CONNECT'))
    .map(R.head)
    .map(({ markers, observerID }) => (state) => {
      state.observers[observerID].markers = [...markers];
      return { ...state };
    });

  const reducer$ = xs.merge(
    initReducer$,
    hostIDReducer$,
    observerConnectReducer$,
    markerReducer$,
    pages.mainPage.store,
    pages.observerDetail.store,
  );

  return {
    DOM: vdom$,
    canvas: xs.merge(pages.mainPage.canvas, pages.observerDetail.canvas),
    // xs.merge(pages.mainPage.canvas, pages.connectObserver.canvas),
    beholder: pages.observerDetail.beholder,
    store: reducer$,
  };
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  canvas: makeCanvasDriver(),
  beholder: makeBeholderServerDriver(),
};

const wrappedMain = withState(main, 'store');

run(wrappedMain, drivers);
