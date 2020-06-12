import xs from 'xstream';
import * as R from 'ramda';
import { div, img } from '@cycle/dom';
import QRCode from 'qrcode';

// drivers
import { drawCommand } from '../drivers/Canvas';

const QR_URL_BASE = 'https://petroochio.github.io/mechamarkers-mobile-pwa/index.html';

const keyCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

function genObserverKey() {
  let key = '';
  key += keyCharMap.charAt(Math.floor(Math.random() * 36));
  key += keyCharMap.charAt(Math.floor(Math.random() * 36));
  key += keyCharMap.charAt(Math.floor(Math.random() * 36));
  key += keyCharMap.charAt(Math.floor(Math.random() * 36));

  return key;
}

function getNewObserverKey(observerList) {
  let newKey = genObserverKey();

  while (R.has(newKey, observerList)) {
    newKey = genObserverKey();
  }

  return newKey;
}

function intent(domSource) {
  return {
  };
}

function createObserver() {
  return {
    id: 'heh',
  };
}

function model(actions, store$) {
  return store$; // xs.combine(actions.canvas$, store$);
}

function makeQRURL(hostID, observerList) {
  const observerID = getNewObserverKey(observerList);
  const url = `${QR_URL_BASE}?host=${hostID}&observerID=${observerID}`;
  return xs.fromPromise(QRCode.toDataURL(url));
}

function view(state$) {
  return state$.map(({ hostID, observers }) => makeQRURL(hostID, observers))
    .flatten()
    .map((url) => div('.connect', [
      img('#qrcode', { attrs: { width: 500, height: 500, src: url } }),
    ]));
}

function ConnectObserver(sources) {
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

export default ConnectObserver;
