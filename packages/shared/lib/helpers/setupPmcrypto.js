/* eslint-disable @typescript-eslint/camelcase */
import { init, createWorker } from 'pmcrypto';

import { loadScript } from './dom';

export const initMain = async (openpgpContents, ellipticOptions) => {
    const mainUrl = URL.createObjectURL(new Blob([openpgpContents], { type: 'text/javascript' }));
    await loadScript(mainUrl);
    URL.revokeObjectURL(mainUrl);

    window.openpgp.config.indutny_elliptic_path = `${window.location.origin}${ellipticOptions.filepath}`;
    window.openpgp.config.indutny_elliptic_fetch_options = {
        integrity: ellipticOptions.integrity,
        credentials: 'same-origin'
    };

    init(window.openpgp);
};

export const initWorker = async (openpgpContents, openpgpWorkerContents) => {
    const workerUrl = URL.createObjectURL(
        new Blob(['self.window = self;', openpgpContents, openpgpWorkerContents], {
            type: 'text/javascript'
        })
    );
    await createWorker({
        path: workerUrl
    });
    URL.revokeObjectURL(workerUrl);
};
