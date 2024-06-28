import { SAFARI_MESSAGE_KEY } from '@proton/pass/constants';
import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull } from '@proton/pass/types';

type NativeSafariMessage =
    | { credentials: MaybeNull<AuthSession> }
    | { refreshCredentials: Pick<RefreshSessionData, 'AccessToken' | 'RefreshTime' | 'RefreshToken'> }
    | { environment: string };

export const sendSafariMessage = (message: NativeSafariMessage) =>
    browser.runtime.sendNativeMessage(SAFARI_MESSAGE_KEY, JSON.stringify(message));
