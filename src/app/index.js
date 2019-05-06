import '@babel/polyfill';
import 'unfetch/polyfill/index'; // https://github.com/developit/unfetch/issues/101

import { hasModulesSupport, getOS } from '../helpers/browser';
import { initMain, initWorker } from './setupPmcrypto';
import { check, redirect } from '../helpers/compat';

import '../sass/app.scss';

// eslint-disable-next-line no-undef
const { main, compat, worker } = PM_OPENPGP;

const dl = ({ filepath, integrity }) => {
    const options = {
        integrity,
        credentials: 'same-origin'
    };
    return fetch(filepath, options).then((response) => response.text());
};

/**
 * There is a bug in iOS that prevents the openpgp worker from functioning properly.
 * It's on all browsers there because they use the webkit engine.
 * See https://github.com/ProtonMail/Angular/issues/8444
 * @returns {boolean}
 */
const isUnsupportedWorker = () => {
    const { name, version } = getOS();
    return name.toLowerCase() === 'ios' && parseInt(version, 10) === 11;
};

(async () => {
    if (!check()) {
        return redirect();
    }

    // pre-fetch everything
    const initPromise = import('./app');
    const isCompat = !hasModulesSupport();
    const openpgpFile = isCompat ? compat : main;
    // Fetch again if it fails, mainly to solve chrome bug (related to dev tools?) "body stream has been lost and cannot be disturbed"
    const openpgpPromise = dl(openpgpFile).catch(() => dl(openpgpFile));
    const workerPromise = dl(worker).catch(() => dl(worker));

    const openpgpContents = await openpgpPromise;
    const [app] = await Promise.all([initPromise, initMain(openpgpContents)]);

    // bootstrap the app
    app.default();

    // Compat browsers do not support the worker.
    if (isCompat || isUnsupportedWorker()) {
        return;
    }

    await initWorker(openpgpContents, await workerPromise);
})();
