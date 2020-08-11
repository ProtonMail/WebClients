import { hasModulesSupport, getOS } from './helpers/browser';
import { initScript, initWorker, setOpenpgp } from './helpers/setupPmcrypto';
import { OPENPGP } from './constants';

let promise: undefined | Promise<void>;

const dl = ({ filepath, integrity }: { filepath: string; integrity?: string }) => {
    const options = {
        integrity,
        credentials: 'include',
    } as const;
    return fetch(filepath, options).then((response) => response.text());
};

/**
 * There is a bug in iOS that prevents the openpgp worker from functioning properly.
 * It's on all browsers there because they use the webkit engine.
 * See https://github.com/ProtonMail/Angular/issues/8444
 */
const isUnsupportedWorker = () => {
    const { name, version } = getOS();
    return name.toLowerCase() === 'ios' && parseInt(version, 10) === 11;
};

/**
 * Initialize openpgp
 */
export const init = async (openpgpConfig: any) => {
    const { main, compat, elliptic, worker } = OPENPGP;

    // pre-fetch everything
    const isCompat = !hasModulesSupport();
    const openpgpFile = isCompat ? compat : main;

    // Fetch again if it fails, mainly to solve chrome bug (related to dev tools?) "body stream has been lost and cannot be disturbed"
    const openpgpPromise = dl(openpgpFile).catch(() => dl(openpgpFile));
    const workerPromise = dl(worker).catch(() => dl(worker));

    const openpgpContents = await openpgpPromise;
    await initScript(openpgpContents);

    const { openpgp } = window as any;
    setOpenpgp(openpgp, elliptic, openpgpConfig);

    // Compat browsers do not support the worker.
    if (isCompat || isUnsupportedWorker()) {
        return;
    }

    // lazily create the workers no need to wait for it to finish
    workerPromise.then((result) => {
        initWorker(openpgpContents, result);
    });
};

/**
 * Get the openpgp init promise singleton
 */
export const loadOpenPGP = (openpgpConfig?: any) => {
    if (!promise) {
        promise = init(openpgpConfig);
    }
    return promise;
};

export const destroyOpenPGP = () => {
    promise = undefined;
    const { openpgp } = window as any;
    if (openpgp) {
        return openpgp.destroyWorker();
    }
};
