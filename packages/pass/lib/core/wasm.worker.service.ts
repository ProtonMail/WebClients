import { WASM_PROCEDURE_TIMEOUT, WASM_WORKER_READY_EVENT } from '@proton/pass/lib/core/constants';
import type { MaybeNull, Result } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';

export type WasmMethods = Record<string, { args: any[]; return: any }>;
export type WasmWorkerOptions = { id: string; spawn: () => Worker };
export type WasmWorkerRPC<T extends WasmMethods, M extends keyof T> = { method: M; args: T[M]['args'] };
export type WasmWorkerMessageEvent<T extends WasmMethods, M extends keyof T> = Result<{ value: T[M]['return'] }>;

type WasmMessageChannel = { port1: MessagePort; port2: MessagePort };

export interface WasmWorkerService<T extends WasmMethods> {
    exec: <M extends keyof T>(method: M, ...args: T[M]['args']) => Promise<T[M]['return']>;
    transfer: (t: Transferable[]) => <M extends keyof T>(method: M, ...args: T[M]['args']) => Promise<T[M]['return']>;
}

export const wasmWorkerServiceFactory = <T extends WasmMethods>(
    options: WasmWorkerOptions,
    channelFactory: () => WasmMessageChannel = () => new MessageChannel()
): WasmWorkerService<T> => {
    let instance: MaybeNull<WasmWorkerService<T>> = null;

    const getInstance = (): WasmWorkerService<T> => {
        if (instance) return instance;

        const state = { ready: false };
        const worker = options.spawn();

        const onReady = (event: MessageEvent) => {
            if (event.data?.type === WASM_WORKER_READY_EVENT) {
                logger.info(`[${options.id}] Worker is ready`);
                worker.removeEventListener('message', onReady);
                state.ready = true;
            }
        };

        worker.addEventListener('message', onReady);

        const send = async <M extends keyof T>(message: WasmWorkerRPC<T, M>, transferable: Transferable[] = []) => {
            await waitUntil(() => state.ready, 250);
            const channel = channelFactory();

            return new Promise<T[M]['return']>((resolve, reject) => {
                const timer = setTimeout(
                    () => reject(new Error(`Procedure timed out [${message.method.toString()}]`)),
                    WASM_PROCEDURE_TIMEOUT
                );

                channel.port2.onmessage = (event: MessageEvent<WasmWorkerMessageEvent<T, M>>) => {
                    if (event.data.ok) resolve(event.data.value);
                    else reject(new Error(event.data.error ?? 'Unknown error'));
                    clearTimeout(timer);
                };

                worker.postMessage(message, [channel.port1, ...transferable]);
            })
                .catch((err) => throwError({ name: `${options.id}Error`, message: err.message }))
                .finally(() => {
                    channel.port1.close();
                    channel.port2.close();
                });
        };

        return (instance = {
            exec: (method, ...args) => send({ method, args }),
            transfer:
                (transferable) =>
                (method, ...args) =>
                    send({ method, args }, transferable),
        });
    };

    return {
        get exec() {
            return getInstance().exec;
        },
        get transfer() {
            return getInstance().transfer;
        },
    };
};
