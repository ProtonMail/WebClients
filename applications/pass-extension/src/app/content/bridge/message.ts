import type { MessageFailure, WorkerResponse } from '@proton/pass/types';
import { waitForPageReady } from '@proton/pass/utils/dom/state';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { throwError } from '@proton/pass/utils/fp/throw';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { wait } from '@proton/shared/lib/helpers/promise';

import { CLIENT_SCRIPT_READY_EVENT } from '../constants.static';
import { ALLOWED_MESSAGES, BRIDGE_ABORT, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';
import type { BridgeAbortSignal, BridgeMessage, BridgeRequest, BridgeResponse } from './types';

export const createBridgeResponse = <T extends BridgeMessage>(
    response: WorkerResponse<T> | MessageFailure,
    token: string
): BridgeResponse<T> => ({ response, token, type: BRIDGE_RESPONSE });

export const createBridgeAbortSignal = (token: string) => ({ token, type: BRIDGE_ABORT });

export const isBridgeRequest = (data: any): data is BridgeRequest =>
    typeof data === 'object' &&
    data?.token !== undefined &&
    data?.type === BRIDGE_REQUEST &&
    ALLOWED_MESSAGES.includes(data?.request?.type);

export const isBridgeAbortSignal =
    (token: string) =>
    (data: any): data is BridgeAbortSignal =>
        typeof data === 'object' && data?.token === token && data?.type === BRIDGE_ABORT;

export const isBridgeResponse =
    <T extends BridgeMessage>(token: string) =>
    (data: any): data is BridgeResponse<T> =>
        typeof data === 'object' && data?.token === token && data?.type === BRIDGE_RESPONSE;

export const createMessageBridge = () => {
    const ready = awaiter<boolean>();

    const init = () => {
        void waitForPageReady()
            .then(() => {
                const onClientScriptReady = (event: MessageEvent) => {
                    if (event.data?.type === CLIENT_SCRIPT_READY_EVENT) {
                        ready.resolve(true);
                        window.removeEventListener('message', onClientScriptReady);
                    }
                };

                window.addEventListener('message', onClientScriptReady);
                return Promise.race([wait(1_000).then(() => throwError({ name: 'Timeout' })), ready]);
            })
            .catch(ready.reject);
    };

    const sendMessage = async <T extends BridgeMessage>(
        request: T,
        options?: { timeout?: number; signal?: AbortSignal }
    ): Promise<WorkerResponse<T> | MessageFailure> => {
        const token = uniqueId(16);
        const message: BridgeRequest<T> = { request, token, type: BRIDGE_REQUEST };
        const response = awaiter<WorkerResponse<T> | MessageFailure>();

        const abort = () => window.postMessage(createBridgeAbortSignal(token));
        options?.signal?.addEventListener('abort', abort);

        const timer = options?.timeout ? setTimeout(abort, options.timeout) : undefined;

        const handleMessage = ({ data }: MessageEvent<any>) => {
            if (isBridgeResponse<T>(token)(data)) response.resolve(data.response);
            if (isBridgeAbortSignal(token)(data)) response.reject(new Error('BridgeAbort'));
        };

        try {
            await ready;
            window.postMessage(message);
            window.addEventListener('message', handleMessage);
            return await response;
        } catch (err: unknown) {
            return { type: 'error', error: err instanceof Error ? err.message : 'Unknown error' };
        } finally {
            window.removeEventListener('message', handleMessage);
            options?.signal?.removeEventListener('abort', abort);
            clearTimeout(timer);
        }
    };

    return { sendMessage, init };
};
