import { throwError } from '@proton/pass/utils/fp/throw';

import type { PassCoreMethod, PassCoreRPC, PassCoreResult, PassCoreService } from './types';

/** Creates a `PassCoreService` instance which spawns the `PassRustCore`
 * binary in a dedicated worker. Communication occurs via postMessaging
 * through MessageChannels (see: `core.worker.ts`) This service should
 * be used to ensure the WASM module will not block the main UI thread */
export const createPassCoreWorkerService = (): PassCoreService => {
    const worker = new Worker(
        /* webpackChunkName: "core.worker" */
        new URL('@proton/pass/lib/core/core.worker', import.meta.url)
    );

    const send = <T extends PassCoreMethod>(message: PassCoreRPC<T>) => {
        const channel = new MessageChannel();

        return new Promise<PassCoreResult<T>>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('PassRustCore procedure timed out')), 1_000);

            channel.port2.onmessage = (event: MessageEvent<PassCoreResult<T>>) => {
                resolve(event.data);
                clearTimeout(timer);
            };

            worker.postMessage(message, [channel.port1]);
        })
            .catch((err) => throwError({ name: 'PassCoreServiceError', message: err.message }))
            .finally(() => {
                channel.port1.close();
                channel.port2.close();
            });
    };

    return { exec: (method, ...args) => send({ method, args }) };
};
