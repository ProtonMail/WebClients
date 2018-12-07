import { init, createWorker } from 'pmcrypto';
import { isIE11 } from './browser';

init({
    openpgp,
    btoa,
    atob
});

createWorker({
    path: isIE11() ? 'openpgp_compat.worker.min.js' : 'openpgp.worker.min.js'
});
