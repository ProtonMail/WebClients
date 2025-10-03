import type { Remote } from 'comlink';
import { releaseProxy, transferHandlers, wrap } from 'comlink';

import { getIsNetworkError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import type { Api as CryptoApi, ApiInterface as CryptoApiInterface } from './api';
import type { InitOptions } from './api.models';
import { mainThreadTransferHandlers } from './transferHandlers';

export interface WorkerInitOptions extends InitOptions {}

export interface WorkerPoolInitOptions {
    poolSize?: number;
    openpgpConfigOptions?: WorkerInitOptions;
}

export interface WorkerPoolInterface extends CryptoApiInterface {
    /**
     * Setup worker pool (singleton instance):
     * create and start workers, and initializes internal Crypto API (incl. pmcrypto and OpenPGP.js)
     * @param options.poolSize - number of workers to start; defaults to `Navigator.hardwareConcurrency()` if available, otherwise to 1.
     */
    init(options?: WorkerPoolInitOptions): Promise<void>;

    /**
     * Close all workers, after clearing their internal key store.
     * After the pool has been destroyed, it is possible to `init()` it again.
     */
    destroy(): Promise<void>;
}

const errorReporter = (err: Error) => {
    if (getIsNetworkError(err)) {
        captureMessage('Network error in crypto worker', {
            level: 'info',
            extra: { message: err.message },
        });
    }

    throw err;
};

// Singleton worker pool.
export const CryptoWorkerPool: WorkerPoolInterface = (() => {
    let workerPool: Remote<CryptoApi>[] | null = null;
    let i = -1;
    let initPromise: Promise<void> | null = null;

    const initWorker = async (openpgpConfigOptions: WorkerInitOptions) => {
        // Webpack static analyser is not especially powerful at detecting web workers that require bundling,
        // see: https://github.com/webpack/webpack.js.org/issues/4898#issuecomment-823073304.
        // Harcoding the path here is the easiet way to get the worker to be bundled properly.
        const RemoteApi = wrap<typeof CryptoApi>(
            new Worker(
                new URL(
                    /* webpackChunkName: "crypto-worker" */
                    './worker.ts',
                    import.meta.url
                )
            )
        );

        await RemoteApi.init(openpgpConfigOptions);
        const worker = await new RemoteApi();
        return worker;
    };

    const destroyWorker = async (worker: Remote<CryptoApi>) => {
        await worker?.clearKeyStore();
        worker?.[releaseProxy]();
    };

    /**
     * Get worker from the pool pool. By default, the workers are picked in a round-robin fashion, to balance the load.
     * However, this might not be desirable for operations like e.g. argon2, which is resource intensive and caches them
     * (wasm module & allocated memory) across calls.
     * @param [fixed] - whether to always return the same worker
     */
    const getWorker = async (fixed = false): Promise<Remote<CryptoApi>> => {
        if (initPromise == null) {
            throw new Error('Uninitialised');
        }
        await initPromise;
        if (workerPool == null) {
            throw new Error('Uninitialised worker pool');
        }
        if (fixed) {
            return workerPool[0];
        }
        i = (i + 1) % workerPool.length;
        return workerPool[i];
    };

    // The return type is technically `Remote<CryptoApi>[]` but that removes some type inference capabilities that are
    // useful to type-check the internal worker pool functions.
    const getAllWorkers = async (): Promise<CryptoApi[]> => {
        if (initPromise == null) {
            throw new Error('Uninitialised');
        }
        await initPromise;
        if (workerPool == null) {
            throw new Error('Uninitialised worker pool');
        }
        return workerPool as any as CryptoApi[];
    };

    return {
        init: ({ poolSize = navigator.hardwareConcurrency || 1, openpgpConfigOptions = {} } = {}) => {
            if (initPromise) {
                throw new Error('already initialised');
            }
            initPromise = (async () => {
                if (workerPool !== null) {
                    throw new Error('worker pool already initialised');
                }
                // We load one worker early to ensure the browser serves the cached resources to the rest of the pool
                workerPool = [await initWorker(openpgpConfigOptions)];
                if (poolSize > 1) {
                    workerPool = workerPool.concat(
                        await Promise.all(
                            new Array(poolSize - 1).fill(null).map(() => initWorker(openpgpConfigOptions))
                        )
                    );
                }
                mainThreadTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));
            })();
        },
        destroy: async () => {
            if (initPromise == null) {
                throw new Error('Uninitialised');
            }
            await initPromise;
            workerPool && (await Promise.all(workerPool.map(destroyWorker)));
            workerPool = null;
            initPromise = null;
        },
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        encryptMessage: async (opts) => (await getWorker()).encryptMessage(opts).catch(errorReporter),
        decryptMessage: async (opts) => (await getWorker()).decryptMessage(opts).catch(errorReporter),
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        signMessage: async (opts) => (await getWorker()).signMessage(opts).catch(errorReporter),
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        verifyMessage: async (opts) => (await getWorker()).verifyMessage(opts),
        verifyCleartextMessage: async (opts) => (await getWorker()).verifyCleartextMessage(opts).catch(errorReporter),
        processMIME: async (opts) => (await getWorker()).processMIME(opts).catch(errorReporter),
        computeHash: async (opts) => (await getWorker()).computeHash(opts).catch(errorReporter),
        computeHashStream: async (opts) => (await getWorker()).computeHashStream(opts).catch(errorReporter),
        computeArgon2: async (opts) => (await getWorker(true)).computeArgon2(opts).catch(errorReporter),

        generateSessionKey: async (opts) => (await getWorker()).generateSessionKey(opts).catch(errorReporter),
        generateSessionKeyForAlgorithm: async (opts) =>
            (await getWorker()).generateSessionKeyForAlgorithm(opts).catch(errorReporter),
        encryptSessionKey: async (opts) => (await getWorker()).encryptSessionKey(opts).catch(errorReporter),
        decryptSessionKey: async (opts) => (await getWorker()).decryptSessionKey(opts).catch(errorReporter),
        importPrivateKey: async (opts) => {
            const [first, ...rest] = await getAllWorkers();
            const result = await first.importPrivateKey(opts).catch(errorReporter);
            await Promise.all(rest.map((worker) => worker.importPrivateKey(opts, result._idx)));
            return result;
        },
        importPublicKey: async (opts) => {
            const [first, ...rest] = await getAllWorkers();
            const result = await first.importPublicKey(opts).catch(errorReporter);
            await Promise.all(rest.map((worker) => worker.importPublicKey(opts, result._idx)));
            return result;
        },
        generateKey: async (opts) => {
            const [first, ...rest] = await getAllWorkers();
            const keyReference = await first.generateKey(opts).catch(errorReporter);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        reformatKey: async (opts) => {
            const [first, ...rest] = await getAllWorkers();
            const keyReference = await first.reformatKey(opts).catch(errorReporter);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        generateE2EEForwardingMaterial: async (opts) =>
            (await getWorker()).generateE2EEForwardingMaterial(opts).catch(errorReporter),
        doesKeySupportE2EEForwarding: async (opts) =>
            (await getWorker()).doesKeySupportE2EEForwarding(opts).catch(errorReporter),
        isE2EEForwardingKey: async (opts) => (await getWorker()).isE2EEForwardingKey(opts).catch(errorReporter),

        replaceUserIDs: async (opts) => {
            await Promise.all((await getAllWorkers()).map((worker) => worker.replaceUserIDs(opts)));
        },
        cloneKeyAndChangeUserIDs: async (opts) => {
            const [first, ...rest] = await getAllWorkers();
            const keyReference = await first.cloneKeyAndChangeUserIDs(opts).catch(errorReporter);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        exportPublicKey: async (opts) => (await getWorker()).exportPublicKey(opts).catch(errorReporter),
        exportPrivateKey: async (opts) => (await getWorker()).exportPrivateKey(opts).catch(errorReporter),
        clearKeyStore: async () => {
            await Promise.all((await getAllWorkers()).map((worker) => worker.clearKeyStore()));
        },
        clearKey: async (opts) => {
            await Promise.all((await getAllWorkers()).map((worker) => worker.clearKey(opts)));
        },

        isExpiredKey: async (opts) => (await getWorker()).isExpiredKey(opts).catch(errorReporter),
        isRevokedKey: async (opts) => (await getWorker()).isRevokedKey(opts).catch(errorReporter),
        canKeyEncrypt: async (opts) => (await getWorker()).canKeyEncrypt(opts).catch(errorReporter),
        getMessageInfo: async (opts) => (await getWorker()).getMessageInfo(opts).catch(errorReporter),
        getKeyInfo: async (opts) => (await getWorker()).getKeyInfo(opts).catch(errorReporter),
        getSignatureInfo: async (opts) => (await getWorker()).getSignatureInfo(opts).catch(errorReporter),
        getArmoredKeys: async (opts) => (await getWorker()).getArmoredKeys(opts),
        getArmoredSignature: async (opts) => (await getWorker()).getArmoredSignature(opts),
        getArmoredMessage: async (opts) => (await getWorker()).getArmoredMessage(opts),
    } as WorkerPoolInterface; // casting needed to 'reuse' CryptoApi's parametric types declarations and preserve dynamic inference of
    // the output types based on the input ones.
})();
