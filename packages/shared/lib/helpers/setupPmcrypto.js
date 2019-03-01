import { init, createWorker } from 'pmcrypto';
import { loadScript } from './dom';

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

    if (window.openpgp.getWorker()) {
        // Wait until all workers are loaded
        await Promise.all(
            window.openpgp.getWorker().workers.map(
                (worker) =>
                    new Promise((resolve) => {
                        const { onmessage } = worker;
                        // eslint-disable-next-line
                        worker.onmessage = () => {
                            // eslint-disable-next-line
                            worker.onmessage = onmessage;
                            resolve();
                        };
                    })
            )
        );
    }

    URL.revokeObjectURL(workerUrl);
};
