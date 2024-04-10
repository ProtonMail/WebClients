import type { MessageFailure, WorkerResponse } from '@proton/pass/types';
import { waitForPageReady } from '@proton/pass/utils/dom/state';
import { type Awaiter, awaiter } from '@proton/pass/utils/fp/promises';
import { error, throwError } from '@proton/pass/utils/fp/throw';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { wait } from '@proton/shared/lib/helpers/promise';

import { CLIENT_SCRIPT_READY_EVENT } from '../constants.static';
import { ALLOWED_MESSAGES, BRIDGE_ABORT, BRIDGE_DISCONNECT, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';
import type { BridgeMessage, BridgeMessageType, BridgeRequest, BridgeResponse } from './types';

type BridgeState = { connected: boolean; ready: Awaiter<void> };
export const BRIDGE_INIT_TIMEOUT = 1_500;

export const createBridgeAbortSignal = (token: string) => ({ token, type: BRIDGE_ABORT });
export const createBridgeDisconnectSignal = () => ({ type: BRIDGE_DISCONNECT });
export const createBridgeResponse = <T extends BridgeMessageType>(
    response: WorkerResponse<BridgeMessage<T>> | MessageFailure,
    token: string
): BridgeResponse<T> => ({ response, token, type: BRIDGE_RESPONSE });

export const messageValidator =
    (type: string) =>
    <T extends any>(token?: string) =>
    (data: any): data is T =>
        typeof data === 'object' && data?.token === token && data?.type === type;

export const isBridgeAbortSignal = messageValidator(BRIDGE_ABORT);
export const isBridgeDisconnectSignal = messageValidator(BRIDGE_DISCONNECT);
export const isBridgeResponse = messageValidator(BRIDGE_RESPONSE);
export const isBridgeRequest = (data: any): data is BridgeRequest =>
    typeof data === 'object' &&
    typeof data?.token === 'string' &&
    data?.type === BRIDGE_REQUEST &&
    ALLOWED_MESSAGES.includes(data?.request?.type);

export const createMessageBridge = () => {
    const state: BridgeState = { connected: true, ready: awaiter<void>() };

    const init = () => {
        void Promise.race([
            waitForPageReady().then(() => {
                const onClientScriptReady = (event: MessageEvent) => {
                    if (event.data?.type === CLIENT_SCRIPT_READY_EVENT) {
                        state.ready.resolve();
                        window.removeEventListener('message', onClientScriptReady);
                    }
                };

                window.addEventListener('message', onClientScriptReady);
                return state.ready;
            }),
            wait(BRIDGE_INIT_TIMEOUT).then(() => throwError({ name: 'BridgeTimeout' })),
        ]).catch(state.ready.reject);
    };

    const sendMessage = async <T extends BridgeMessageType>(
        request: BridgeMessage<T>,
        options?: { timeout?: number; signal?: AbortSignal }
    ): Promise<WorkerResponse<BridgeMessage<T>> | MessageFailure> => {
        const token = uniqueId(16);
        const message: BridgeRequest<T> = { request, token, type: BRIDGE_REQUEST };
        const response = awaiter<WorkerResponse<BridgeMessage<T>> | MessageFailure>();

        const abort = () => window.postMessage(createBridgeAbortSignal(token));
        options?.signal?.addEventListener('abort', abort);

        const timer = options?.timeout ? setTimeout(abort, options.timeout) : undefined;

        const handleMessage = ({ data }: MessageEvent<any>) => {
            if (isBridgeResponse<BridgeResponse<T>>(token)(data)) response.resolve(data.response);
            if (isBridgeAbortSignal(token)(data)) response.reject(error({ name: 'BridgeAbort' }));
            if (isBridgeDisconnectSignal()(data)) {
                state.connected = false;
                response.reject(error({ name: 'BridgeDisconnected' }));
            }
        };

        try {
            await (state.connected ? state.ready : throwError({ name: 'BridgeDisconnected' }));
            window.postMessage(message);
            window.addEventListener('message', handleMessage);
            return await response;
        } catch (err: unknown) {
            return {
                type: 'error',
                ...(err instanceof Error ? { error: err.name, message: err.message } : { error: 'UnknownError' }),
            };
        } finally {
            window.removeEventListener('message', handleMessage);
            options?.signal?.removeEventListener('abort', abort);
            clearTimeout(timer);
        }
    };

    return {
        init,
        getState: () => state,
        sendMessage,
    };
};
