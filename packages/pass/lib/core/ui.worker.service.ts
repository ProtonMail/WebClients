import type { PassUIMethod, PassUIRPC, PassUIResult, PassUIService } from '@proton/pass/lib/core/ui.types';
import type { MaybeNull } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';

import { WASM_PROCEDURE_TIMEOUT, WASM_WORKER_READY_EVENT } from './constants';

const createPassUIWorkerService = (): PassUIService => {
    const state = { ready: false };

    const worker = new Worker(
        /* webpackChunkName: "pass-ui.worker" */
        new URL('@proton/pass/lib/core/ui.worker', import.meta.url)
    );

    const onReady = (event: MessageEvent) => {
        if (event.data?.type === WASM_WORKER_READY_EVENT) {
            logger.info('[PassUIWorker] Worker is ready');
            worker.removeEventListener('message', onReady);
            state.ready = true;
        }
    };

    worker.addEventListener('message', onReady);

    const send = async <T extends PassUIMethod>(message: PassUIRPC<T>, transferable: Transferable[] = []) => {
        await waitUntil(() => state.ready, 250);
        const channel = new MessageChannel();

        return new Promise<PassUIResult<T>>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error(`[PassUIWorker] Procedure timed out [${message.method}]`)),
                WASM_PROCEDURE_TIMEOUT
            );

            channel.port2.onmessage = (event: MessageEvent<PassUIResult<T>>) => {
                resolve(event.data);
                clearTimeout(timer);
            };

            worker.postMessage(message, [channel.port1, ...transferable]);
        })
            .catch((err) => throwError({ name: 'PassUIServiceError', message: err.message }))
            .finally(() => {
                channel.port1.close();
                channel.port2.close();
            });
    };

    return {
        exec: (method, ...args) => send({ method, args }),
        transfer:
            (transferable) =>
            (method, ...args) =>
                send({ method, args }, transferable),
    };
};

let instance: MaybeNull<PassUIService> = null;

export const PassUIWorkerService: PassUIService = {
    get exec() {
        if (!instance) instance = createPassUIWorkerService();
        return instance.exec;
    },
    get transfer() {
        if (!instance) instance = createPassUIWorkerService();
        return instance.transfer;
    },
};
