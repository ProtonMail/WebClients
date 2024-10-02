import { SAFARI_MESSAGE_KEY } from '@proton/pass/constants';
import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { PullForkCall } from '@proton/pass/lib/auth/fork';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { WorkerMessageResponse } from '@proton/pass/types';
import { type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

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

    try {
        const result = await Promise.race([
            browser.tabs.sendMessage(
                payload.tabId,
                backgroundMessage({
                    type: WorkerMessageType.AUTH_PULL_FORK,
                    payload: { selector: payload.selector },
                })
            ) as Promise<WorkerMessageResponse<WorkerMessageType.AUTH_PULL_FORK>>,
            wait(30_000).then(() => throwError({ message: 'Forking session timed out' })),
        ]);

        if (!result?.ok) throw new Error(result?.error ?? 'Unknown error occurred');
        return result;
    } catch (err) {
        logger.warn('[Safari] Failed pulling fork', err);
        throw err;
    }
};
