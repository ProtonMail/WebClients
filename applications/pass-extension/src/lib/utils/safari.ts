import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import type { AuthPullForkMessage, WorkerMessageResponse } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { SAFARI_MESSAGE_KEY } from '@proton/pass/constants';
import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { PullForkCall } from '@proton/pass/lib/auth/fork';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils/index';
import { throwError } from '@proton/pass/utils/fp/throw';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

type SafariHostCredentials = Pick<AuthSession, 'UID' | 'AccessToken' | 'RefreshToken' | 'UserID'>;
type SafariHostRefreshTokens = Pick<RefreshSessionData, 'AccessToken' | 'RefreshTime' | 'RefreshToken'>;

type NativeSafariMessage =
    | { credentials: MaybeNull<SafariHostCredentials> }
    | { refreshCredentials: SafariHostRefreshTokens }
    | { readFromClipboard: {} }
    | { writeToClipboard: { Content: string } }
    | { environment: string };

/** In Safari, `browser.tabs.getCurrent()` called from the popover returns
 * the tab behind it — so a URL check fails when the tab behind is itself
 * the expanded popup.html. Ask the extension for its "popup" views: the
 * popover window is listed there, the expanded tab is not. */
export const isSafariPopoverWindow = (): boolean => browser.extension.getViews({ type: 'popup' }).includes(window);

export const intoSafariCredentials = (session: AuthSession): SafariHostCredentials => ({
    UID: session.UID,
    AccessToken: session.AccessToken,
    RefreshToken: session.RefreshToken,
    UserID: session.UserID,
});

export const sendSafariMessage = async <T = unknown>(message: NativeSafariMessage): Promise<Maybe<T>> => {
    const type = Object.keys(message)[0];

    try {
        logger.info(`[Safari::NM] dispatching message [${type}]`);
        const result = await browser.runtime.sendNativeMessage<string, T>(SAFARI_MESSAGE_KEY, JSON.stringify(message));
        logger.debug(`[Safari::NM] message processed [${type}]`);
        return result;
    } catch (err) {
        logger.warn(`[Safari::NM] message failure [${type}]`, err);
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
