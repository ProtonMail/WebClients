import { init, createWorker } from 'pmcrypto';
import { hasModulesSupport } from './browser';

init(window.openpgp);

initPmcrypto();

async function initPmcrypto() {
    // NOTE: THESE VALUES ARE TRANSFORMED BY WEBPACK WITH THE DEFINE PLUGIN.
    const openpgpFile = hasModulesSupport() ? OPENPGP_FILE : OPENPGP_COMPAT_FILE; // eslint-disable-line no-undef
    const workerFile = OPENPGP_WORKER_FILE; // eslint-disable-line no-undef

    // new Worker() and importScripts() don't have any way to pass SRI info,
    // so we download the scripts manually with fetch().
    const [openpgpContents, workerContents] = await Promise.all([
        // A fetch polyfill is included in the compat build of OpenPGP.js
        fetch(openpgpFile.path, {
            integrity: openpgpFile.integrity
        }).then((res) => res.text()),
        fetch(workerFile.path, {
            integrity: workerFile.integrity
        }).then((res) => res.text())
    ]);
    // Replace the call to importScripts in the worker source with the openpgp source
    const workerContentsReplaced = workerContents.split('importScripts("openpgp.min.js");').join(openpgpContents);
    // Create an Object URL pointing to the replaced worker source
    const workerUrl = URL.createObjectURL(
        new Blob(
            [
                // Let the code below know the Object URL was loaded
                'postMessage({ event: "load" });',
                workerContentsReplaced
            ],
            { type: 'text/javascript' }
        )
    );

    createWorker({
        path: workerUrl
    });

    if (openpgp.getWorker()) {
        // Wait until all workers are loaded
        await Promise.all(
            openpgp.getWorker().workers.map(
                (worker) =>
                    new Promise((resolve) => {
                        const onmessage = worker.onmessage;
                        worker.onmessage = () => {
                            worker.onmessage = onmessage;
                            resolve();
                        };
                    })
            )
        );
    }
    // Release the Object URL
    URL.revokeObjectURL(workerUrl);
}
