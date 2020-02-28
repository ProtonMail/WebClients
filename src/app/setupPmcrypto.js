import { init, createWorker } from 'pmcrypto';
import { loadScript } from '../helpers/browser';

export const initScript = async (openpgpContents) => {
    const mainUrl = URL.createObjectURL(new Blob([openpgpContents], { type: 'text/javascript' }));
    await loadScript(mainUrl);
    URL.revokeObjectURL(mainUrl);
};

export const setOpenpgp = (openpgp, ellipticOptions) => {
    openpgp.config.indutny_elliptic_path = `${window.location.origin}/${ellipticOptions.filepath}`;
    openpgp.config.indutny_elliptic_fetch_options = {
        integrity: ellipticOptions.integrity,
        credentials: 'same-origin'
    };
    init(openpgp);
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
