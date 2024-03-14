import type { MessageFailure, WorkerResponse } from '@proton/pass/types';
import { waitForPageReady } from '@proton/pass/utils/dom/state';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { throwError } from '@proton/pass/utils/fp/throw';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { wait } from '@proton/shared/lib/helpers/promise';

import { CLIENT_SCRIPT_READY_EVENT } from '../constants.static';
import { ALLOWED_MESSAGES, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';
import type { BridgeMessage, BridgeRequest, BridgeResponse } from './types';

export const createBridgeResponse = <T extends BridgeMessage>(
    response: WorkerResponse<T> | MessageFailure,
    token: string
): BridgeResponse<T> => ({ response, token, type: BRIDGE_RESPONSE });

export const isBridgeRequest = (data: any): data is BridgeRequest =>
    typeof data === 'object' &&
    data?.token !== undefined &&
    data?.type === BRIDGE_REQUEST &&
    ALLOWED_MESSAGES.includes(data?.request?.type);

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

    const sendMessage = async <T extends BridgeMessage>(request: T): Promise<WorkerResponse<T> | MessageFailure> => {
        const token = uniqueId(16);
        const response = awaiter<WorkerResponse<T> | MessageFailure>();
        const message: BridgeRequest<T> = { request, token, type: BRIDGE_REQUEST };

        const handleMessage = ({ data }: MessageEvent<any>) =>
            isBridgeResponse<T>(token)(data) && response.resolve(data.response);

        try {
            await ready;
            window.postMessage(message);
            window.addEventListener('message', handleMessage);
            return await response;
        } catch (err: unknown) {
            return { type: 'error', error: getErrorMessage(err) };
        } finally {
            window.removeEventListener('message', handleMessage);
        }
    };

    return { sendMessage, init };
};
