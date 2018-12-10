import { init, createWorker } from 'pmcrypto';
import { isIE11 } from './browser';

init(window.openpgp);

createWorker({
    // NOTE: THESE VALUES ARE TRANSFORMED BY WEBPACK WITH THE DEFINE PLUGIN.
    path: isIE11() ? OPENPGP_WORKER_COMPAT : OPENPGP_WORKER // eslint-disable-line no-undef
});
