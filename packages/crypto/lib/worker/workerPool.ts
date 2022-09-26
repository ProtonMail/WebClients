import { Remote, releaseProxy, transferHandlers, wrap } from 'comlink';

import type { Api as CryptoApi, ApiInterface as CryptoApiInterface } from './api';
import { mainThreadTransferHandlers } from './transferHandlers';

export interface WorkerPoolInterface extends CryptoApiInterface {
    /**
     * Setup worker pool (singleton instance):
     * create and start workers, and initializes internal Crypto API (incl. pmcrypto and OpenPGP.js)
     * @param options.poolSize - number of workers to start; defaults to `Navigator.hardwareConcurrency()` if available, otherwise to 1.
     */
    init(options?: { poolSize?: number }): Promise<void>;

    /**
     * Close all workers, after clearing their internal key store.
     * After the pool has been destroyed, it is possible to `init()` it again.
     */
    destroy(): Promise<void>;
}

// Singleton worker pool.
export const CryptoWorkerPool: WorkerPoolInterface = (() => {
    let workerPool: Remote<CryptoApi>[] | null = null;
    let i = -1;

    const initWorker = async () => {
        // Webpack static analyser is not especially powerful at detecting web workers that require bundling,
        // see: https://github.com/webpack/webpack.js.org/issues/4898#issuecomment-823073304.
        // Harcoding the path here is the easiet way to get the worker to be bundled properly.
        const RemoteApi = wrap<typeof CryptoApi>(
            new Worker(new URL(/* webpackChunkName: "crypto-worker" */ './worker.ts', import.meta.url))
        );
        const worker = await new RemoteApi();
        return worker;
    };

    const destroyWorker = async (worker: Remote<CryptoApi>) => {
        await worker?.clearKeyStore();
        worker?.[releaseProxy]();
    };

    const getWorker = (): Remote<CryptoApi> => {
        if (workerPool == null) {
            throw new Error('Uninitialised worker pool');
        }
        i = (i + 1) % workerPool.length;
        return workerPool[i];
    };

    // The return type is technically `Remote<CryptoApi>[]` but that removes some type inference capabilities that are
    // useful to type-check the internal worker pool functions.
    const getAllWorkers = (): CryptoApi[] => {
        if (workerPool == null) {
            throw new Error('Uninitialised worker pool');
        }
        return workerPool as any as CryptoApi[];
    };

    return {
        init: async ({ poolSize = navigator.hardwareConcurrency || 1 } = {}) => {
            if (workerPool !== null) {
                throw new Error('worker pool already initialised');
            }
            // We load one worker early to ensure the browser serves the cached resources to the rest of the pool
            workerPool = [await initWorker()];
            if (poolSize > 1) {
                workerPool = workerPool.concat(
                    await Promise.all(new Array(poolSize - 1).fill(null).map(() => initWorker()))
                );
            }
            mainThreadTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));
        },
        destroy: async () => {
            workerPool && (await Promise.all(workerPool.map(destroyWorker)));
            workerPool = null;
        },
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        encryptMessage: (opts) => getWorker().encryptMessage(opts),
        decryptMessage: (opts) => getWorker().decryptMessage(opts),
        decryptMessageLegacy: (opts) => getWorker().decryptMessageLegacy(opts),
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        signMessage: (opts) => getWorker().signMessage(opts),
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        verifyMessage: (opts) => getWorker().verifyMessage(opts),
        verifyCleartextMessage: (opts) => getWorker().verifyCleartextMessage(opts),
        processMIME: (opts) => getWorker().processMIME(opts),
        computeHash: (opts) => getWorker().computeHash(opts),

        generateSessionKey: (opts) => getWorker().generateSessionKey(opts),
        generateSessionKeyForAlgorithm: (opts) => getWorker().generateSessionKeyForAlgorithm(opts),
        encryptSessionKey: (opts) => getWorker().encryptSessionKey(opts),
        decryptSessionKey: (opts) => getWorker().decryptSessionKey(opts),
        importPrivateKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const result = await first.importPrivateKey(opts);
            await Promise.all(rest.map((worker) => worker.importPrivateKey(opts, result._idx)));
            return result;
        },
        importPublicKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const result = await first.importPublicKey(opts);
            await Promise.all(rest.map((worker) => worker.importPublicKey(opts, result._idx)));
            return result;
        },
        generateKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const keyReference = await first.generateKey(opts);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        reformatKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const keyReference = await first.reformatKey(opts);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        replaceUserIDs: async (opts) => {
            await Promise.all(getAllWorkers().map((worker) => worker.replaceUserIDs(opts)));
        },
        exportPublicKey: (opts) => getWorker().exportPublicKey(opts),
        exportPrivateKey: (opts) => getWorker().exportPrivateKey(opts),
        clearKeyStore: async () => {
            await Promise.all(getAllWorkers().map((worker) => worker.clearKeyStore()));
        },
        clearKey: async (opts) => {
            await Promise.all(getAllWorkers().map((worker) => worker.clearKey(opts)));
        },

        isExpiredKey: (opts) => getWorker().isExpiredKey(opts),
        isRevokedKey: (opts) => getWorker().isRevokedKey(opts),
        canKeyEncrypt: (opts) => getWorker().canKeyEncrypt(opts),
        getSHA256Fingerprints: (opts) => getWorker().getSHA256Fingerprints(opts),
        getMessageInfo: (opts) => getWorker().getMessageInfo(opts),
        getKeyInfo: (opts) => getWorker().getKeyInfo(opts),
        getSignatureInfo: (opts) => getWorker().getSignatureInfo(opts),
        getArmoredKeys: (opts) => getWorker().getArmoredKeys(opts),
        getArmoredSignature: (opts) => getWorker().getArmoredSignature(opts),
        getArmoredMessage: (opts) => getWorker().getArmoredMessage(opts),
    } as WorkerPoolInterface; // casting needed to 'reuse' CryptoApi's parametric types declarations and preserve dynamic inference of
    // the output types based on the input ones.
})();
