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

    // pre-fetch app
    const appPromise = import('./app');

    // fetch openpgp main + worker file
    const [openpgpContents, workerContents] = await Promise.all([dl(hasModulesSupport() ? main : compat), dl(worker)]);

    // wait for the app to be fetched and openpgp main file to be initialized
    const [app] = await Promise.all([appPromise, initMain(openpgpContents)]);

    // bootstrap the app
    app.default();

    if (isUnsupportedWorker()) {
        return;
    }

    await initWorker(openpgpContents, workerContents);
})();
