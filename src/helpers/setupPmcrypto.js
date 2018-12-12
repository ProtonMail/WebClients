import { init, createWorker } from 'pmcrypto';
import { hasModulesSupport } from './browser';

init(window.openpgp);

createWorker({
    // NOTE: THESE VALUES ARE TRANSFORMED BY WEBPACK WITH THE DEFINE PLUGIN.
    path: hasModulesSupport() ? OPENPGP_WORKER : OPENPGP_WORKER_COMPAT // eslint-disable-line no-undef
});
