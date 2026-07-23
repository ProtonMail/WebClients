import * as Comlink from 'comlink';
// Polyfill Uint8Array.fromBase64/toBase64
import 'core-js/proposals/array-buffer-base64';
import 'core-js/stable';

import SearchWorker from './SearchWorker';

Comlink.expose(new SearchWorker());
