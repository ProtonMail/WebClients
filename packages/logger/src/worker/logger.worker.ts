import * as Comlink from 'comlink';
import 'core-js/proposals/array-buffer-base64';
import 'core-js/stable';

import LogReader from './LogReader';

Comlink.expose(new LogReader());
