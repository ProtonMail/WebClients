import type { PassCoreMethod, PassCoreRPC, PassCoreResult, PassCoreService } from '@proton/pass/lib/core/core.types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';

import { WASM_PROCEDURE_TIMEOUT } from './constants';

/** Creates a `PassCoreService` instance which spawns the `PassRustCore`
 * binary in a dedicated worker. Communication occurs via postMessaging
 * through MessageChannels (see: `core.worker.ts`). This service should
 * be used to ensure the WASM module will not block the main UI thread */
export const createPassCoreWorkerService = (): PassCoreService => {
    const state = { ready: false };

    const worker = new Worker(
        /* webpackChunkName: "pass-core.worker" */
        new URL('@proton/pass/lib/core/core.worker', import.meta.url)
    );

    const onReady = (event: MessageEvent) => {
        if (event.data?.type === 'PassCoreUI::worker_ready') {
            logger.info('[PassCoreWorker] Worker is ready');
            worker.removeEventListener('message', onReady);
            state.ready = true;
        }
    };

    worker.addEventListener('message', onReady);

    const send = async <T extends PassCoreMethod>(message: PassCoreRPC<T>) => {
        await waitUntil(() => state.ready, 250);
        const channel = new MessageChannel();

        return new Promise<PassCoreResult<T>>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error(`[PassCoreWorker] Procedure timed out [${message.method}]`)),
                WASM_PROCEDURE_TIMEOUT
            );

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
