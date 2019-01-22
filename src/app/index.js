import '@babel/polyfill';
import 'unfetch/polyfill/index'; // https://github.com/developit/unfetch/issues/101

import { hasModulesSupport } from '../helpers/browser';
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

    // lazily create the workers
    await initWorker(openpgpContents, workerContents);
})();
