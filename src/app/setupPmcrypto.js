import { init, createWorker } from 'pmcrypto';
import { loadScript } from '../helpers/browser';

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
        new Blob(['self.window = self;', openpgpContents, openpgpWorkerContents], {
            type: 'text/javascript'
        })
    );
    await createWorker({ path: workerUrl });
    URL.revokeObjectURL(workerUrl);
};
