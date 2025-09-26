import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import type { AuthPullForkMessage, WorkerMessageResponse } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { SAFARI_MESSAGE_KEY } from '@proton/pass/constants';
import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { PullForkCall } from '@proton/pass/lib/auth/fork';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

type NativeSafariMessage =
    | { credentials: MaybeNull<AuthSession> }
    | { refreshCredentials: Pick<RefreshSessionData, 'AccessToken' | 'RefreshTime' | 'RefreshToken'> }
    | { environment: string };

export const sendSafariMessage = async <T = unknown>(message: NativeSafariMessage): Promise<Maybe<T>> => {
    try {
        const result = await browser.runtime.sendNativeMessage<string, T>(SAFARI_MESSAGE_KEY, JSON.stringify(message));
        return result;
    } catch (err) {
        logger.warn(`[Safari] Native message failure`, err);
    }
};

/** Safari does not correctly attach cookies service-worker side
 * when pulling the fork during authentication. As such, we must
 * resort to executing the request in a custom script on account */
export const safariPullFork: PullForkCall = async (payload) => {
    if (payload.mode !== 'extension') throw new Error('Cannot securely fork session');

    try {
        const result = await Promise.race([
            browser.tabs.sendMessage<AuthPullForkMessage, WorkerMessageResponse<WorkerMessageType.AUTH_PULL_FORK>>(
                payload.tabId,
                backgroundMessage({
                    type: WorkerMessageType.AUTH_PULL_FORK,
                    payload: { selector: payload.selector },
                })
            ),
            wait(30_000).then(() => throwError({ message: 'Forking session timed out' })),
        ]);

        if (!result?.ok) throw new Error(result?.error ?? 'Unknown error occurred');
        return result;
    } catch (err) {
        logger.warn('[Safari] Failed pulling fork', err);
        throw err;
    }
};
