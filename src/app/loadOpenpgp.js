import { hasModulesSupport, getOS } from '../helpers/browser';
import { initScript, initWorker, setOpenpgp } from './setupPmcrypto';

// eslint-disable-next-line no-undef
const { main, compat, worker, elliptic } = PM_OPENPGP;

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

export const loadOpenpgp = async () => {
    const isCompat = !hasModulesSupport();
    const openpgpFile = isCompat ? compat : main;
    // Fetch again if it fails, mainly to solve chrome bug (related to dev tools?) "body stream has been lost and cannot be disturbed"
    const openpgpPromise = dl(openpgpFile).catch(() => dl(openpgpFile));
    const workerPromise = dl(worker).catch(() => dl(worker));

    const openpgpContents = await openpgpPromise;
    await initScript(openpgpContents);
    setOpenpgp(window.openpgp, elliptic);

    // Compat browsers do not support the worker.
    if (isCompat || isUnsupportedWorker()) {
        return;
    }

    await initWorker(openpgpContents, await workerPromise);
};

export const destroyOpenpgp = () => {
    if (window.openpgp) {
        return window.openpgp.destroyWorker();
    }
};
