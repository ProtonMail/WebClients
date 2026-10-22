import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';

const canUseOAuthPopupV2 = () => hasInboxDesktopFeature('OAuthPopupV2') || getIsIframe();

/**
 * Tells the desktop (Electron) app that an OAuth-style popup is about to open, so it renders the
 * popup as a native window instead of handing the URL off to the system browser. The desktop only
 * captures a popup whose URL matches an active OAuth session's `authorizationUrl`; without this
 * signal the window escapes to the default browser. No-op on web, where `invokeInboxDesktopIPC` resolves
 * immediately.
 *
 * Pair every call with {@link notifyDesktopOAuthPopupFinished} once the popup resolves so the
 * desktop clears the session.
 */
export const notifyDesktopOAuthPopupStarted = (authorizationUrl: string, sessionId: string) =>
    canUseOAuthPopupV2()
        ? invokeInboxDesktopIPC({
              type: 'oauthPopupOpenedV2',
              payload: { action: 'oauthPopupStarted', authorizationUrl, sessionId },
          })
        : invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupStarted' });

/** Counterpart to {@link notifyDesktopOAuthPopupStarted}: signals the popup has closed. */
export const notifyDesktopOAuthPopupFinished = (sessionId: string) =>
    canUseOAuthPopupV2()
        ? invokeInboxDesktopIPC({
              type: 'oauthPopupOpenedV2',
              payload: { action: 'oauthPopupFinished', sessionId },
          })
        : invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupFinished' });
