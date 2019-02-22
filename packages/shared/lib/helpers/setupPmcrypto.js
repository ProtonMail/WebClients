import { init, createWorker } from 'pmcrypto';
import { loadScript } from './dom';

/**
 * TODO: Move these functions to pmcrypto.
 */

export const initMain = async (openpgpContents) => {
    const mainUrl = URL.createObjectURL(new Blob([openpgpContents], { type: 'text/javascript' }));
    await loadScript(mainUrl);
    URL.revokeObjectURL(mainUrl);
    init(window.openpgp);
};

export const initWorker = async (openpgpContents, openpgpWorkerContents) => {
    const workerUrl = URL.createObjectURL(
        new Blob(['postMessage({ event: "load" });self.window = self;', openpgpContents, openpgpWorkerContents], {
            type: 'text/javascript'
        })
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

    URL.revokeObjectURL(workerUrl);
};
