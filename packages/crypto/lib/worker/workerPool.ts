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
    const getWorker = (fixed = false): Remote<CryptoApi> => {
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
    const getAllWorkers = (): CryptoApi[] => {
        if (workerPool == null) {
            throw new Error('Uninitialised worker pool');
        }
        return workerPool as any as CryptoApi[];
    };

    return {
        init: async ({
            poolSize = navigator.hardwareConcurrency || 1,
            openpgpConfigOptions = { enforceOpenpgpGrammar: false },
        } = {}) => {
            if (workerPool !== null) {
                throw new Error('worker pool already initialised');
            }
            // We load one worker early to ensure the browser serves the cached resources to the rest of the pool
            workerPool = [await initWorker(openpgpConfigOptions)];
            if (poolSize > 1) {
                workerPool = workerPool.concat(
                    await Promise.all(new Array(poolSize - 1).fill(null).map(() => initWorker(openpgpConfigOptions)))
                );
            }
            mainThreadTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));
        },
        destroy: async () => {
            workerPool && (await Promise.all(workerPool.map(destroyWorker)));
            workerPool = null;
        },
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        encryptMessage: (opts) => getWorker().encryptMessage(opts).catch(errorReporter),
        decryptMessage: (opts) => getWorker().decryptMessage(opts).catch(errorReporter),
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        signMessage: (opts) => getWorker().signMessage(opts).catch(errorReporter),
        // @ts-ignore marked as non-callable, unclear why, might be due to a limitation of type Remote
        verifyMessage: (opts) => getWorker().verifyMessage(opts),
        verifyCleartextMessage: (opts) => getWorker().verifyCleartextMessage(opts).catch(errorReporter),
        processMIME: (opts) => getWorker().processMIME(opts).catch(errorReporter),
        computeHash: (opts) => getWorker().computeHash(opts).catch(errorReporter),
        computeHashStream: (opts) => getWorker().computeHashStream(opts).catch(errorReporter),
        computeArgon2: (opts) => getWorker(true).computeArgon2(opts).catch(errorReporter),

        generateSessionKey: (opts) => getWorker().generateSessionKey(opts).catch(errorReporter),
        generateSessionKeyForAlgorithm: (opts) => getWorker().generateSessionKeyForAlgorithm(opts).catch(errorReporter),
        encryptSessionKey: (opts) => getWorker().encryptSessionKey(opts).catch(errorReporter),
        decryptSessionKey: (opts) => getWorker().decryptSessionKey(opts).catch(errorReporter),
        importPrivateKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const result = await first.importPrivateKey(opts).catch(errorReporter);
            await Promise.all(rest.map((worker) => worker.importPrivateKey(opts, result._idx)));
            return result;
        },
        importPublicKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const result = await first.importPublicKey(opts).catch(errorReporter);
            await Promise.all(rest.map((worker) => worker.importPublicKey(opts, result._idx)));
            return result;
        },
        generateKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const keyReference = await first.generateKey(opts).catch(errorReporter);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        reformatKey: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const keyReference = await first.reformatKey(opts).catch(errorReporter);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        generateE2EEForwardingMaterial: (opts) => getWorker().generateE2EEForwardingMaterial(opts).catch(errorReporter),
        doesKeySupportE2EEForwarding: async (opts) =>
            getWorker().doesKeySupportE2EEForwarding(opts).catch(errorReporter),
        isE2EEForwardingKey: async (opts) => getWorker().isE2EEForwardingKey(opts).catch(errorReporter),

        replaceUserIDs: async (opts) => {
            await Promise.all(getAllWorkers().map((worker) => worker.replaceUserIDs(opts)));
        },
        cloneKeyAndChangeUserIDs: async (opts) => {
            const [first, ...rest] = getAllWorkers();
            const keyReference = await first.cloneKeyAndChangeUserIDs(opts).catch(errorReporter);
            const key = await first.exportPrivateKey({ privateKey: keyReference, passphrase: null, format: 'binary' });
            await Promise.all(
                rest.map((worker) => worker.importPrivateKey({ binaryKey: key, passphrase: null }, keyReference._idx))
            );
            return keyReference;
        },
        exportPublicKey: (opts) => getWorker().exportPublicKey(opts).catch(errorReporter),
        exportPrivateKey: (opts) => getWorker().exportPrivateKey(opts).catch(errorReporter),
        clearKeyStore: async () => {
            await Promise.all(getAllWorkers().map((worker) => worker.clearKeyStore()));
        },
        clearKey: async (opts) => {
            await Promise.all(getAllWorkers().map((worker) => worker.clearKey(opts)));
        },

        isExpiredKey: (opts) => getWorker().isExpiredKey(opts).catch(errorReporter),
        isRevokedKey: (opts) => getWorker().isRevokedKey(opts).catch(errorReporter),
        canKeyEncrypt: (opts) => getWorker().canKeyEncrypt(opts).catch(errorReporter),
        getMessageInfo: (opts) => getWorker().getMessageInfo(opts).catch(errorReporter),
        getKeyInfo: (opts) => getWorker().getKeyInfo(opts).catch(errorReporter),
        getSignatureInfo: (opts) => getWorker().getSignatureInfo(opts).catch(errorReporter),
        getArmoredKeys: (opts) => getWorker().getArmoredKeys(opts),
        getArmoredSignature: (opts) => getWorker().getArmoredSignature(opts),
        getArmoredMessage: (opts) => getWorker().getArmoredMessage(opts),
    } as WorkerPoolInterface; // casting needed to 'reuse' CryptoApi's parametric types declarations and preserve dynamic inference of
    // the output types based on the input ones.
})();
