import type { Runtime } from 'webextension-polyfill';

import { SAFARI_MESSAGE_KEY } from '@proton/pass/constants';
import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { PullForkCall } from '@proton/pass/lib/auth/fork';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { WorkerMessageWithSender } from '@proton/pass/types';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import type { PullForkResponse } from '@proton/shared/lib/authentication/interface';

type NativeSafariMessage =
    | { credentials: MaybeNull<AuthSession> }
    | { refreshCredentials: Pick<RefreshSessionData, 'AccessToken' | 'RefreshTime' | 'RefreshToken'> }
    | { environment: string };

export const sendSafariMessage = (message: NativeSafariMessage) =>
    browser.runtime.sendNativeMessage(SAFARI_MESSAGE_KEY, JSON.stringify(message));

/** Safari does not correctly attach cookies service-worker side
 * when pulling the fork during authentication. As such, we must
 * resort to executing the request in a custom script on account */
export const safariPullFork: PullForkCall = async (payload) => {
    if (payload.mode !== 'secure') throw new Error('Cannot securely fork session');

    return new Promise<PullForkResponse>(async (resolve, reject) => {
        let timer: NodeJS.Timeout;

        const listener = (message: WorkerMessageWithSender, sender: Runtime.MessageSender): void => {
            if (message.sender !== 'background' && sender.tab?.id === payload.tabId) {
                if (message.type === WorkerMessageType.AUTH_PULL_FORK_RES) {
                    clearTimeout(timer);
                    browser.runtime.onMessage.removeListener(listener);
                    if (message.payload.ok) resolve(message.payload);
                    else reject(new Error(message.payload.error ?? ''));
                }
            }
        };

        const rejector = (err: unknown) => {
            logger.warn('[Safari] Failed pulling fork', err);
            clearTimeout(timer);
            browser.runtime.onMessage.removeListener(listener);
            reject(err);
        };

        try {
            browser.runtime.onMessage.addListener(listener);
            timer = setTimeout(() => rejector(new Error('Forking session timed out')), 30_000);

            /** Send a pull fork request to the tabID which initiated
             * the fork consumption. The `sendMessage` tab API does not
             * correctly support asynchronous message responses in safari. */
            void browser.tabs.sendMessage(
                payload.tabId,
                backgroundMessage({
                    type: WorkerMessageType.AUTH_PULL_FORK_REQ,
                    payload: { selector: payload.selector },
                })
            );
        } catch (err) {
            rejector(err);
        }
    });
};
