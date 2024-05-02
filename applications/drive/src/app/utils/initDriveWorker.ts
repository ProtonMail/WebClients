// The sole purpose of this "initialisation" is to load in browser memory the required assets for the drive-worker.
// This prevents errors when we deploy where the requested assets are out of sync / not existent anymore.
// Please be cautious when changing this function.

export const initDriveWorker = () => {
    const worker = new Worker(
        /* webpackChunkName: "drive-worker" */
        /* webpackPrefetch: true */
        /* webpackPreload: true */
        new URL('../store/_uploads/worker/worker.ts', import.meta.url)
    );

    // This module is imported subsequently inside the worker (workerController.ts) so for the combination worker+crypto-worker-api to work we have to load in browser cache both
    import(/* webpackChunkName: "crypto-worker-api" */ '@proton/crypto/lib/worker/api');

    worker.terminate();
};
