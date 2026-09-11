import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

/**
 * Tells the desktop (Electron) app that an OAuth-style popup is about to open, so it renders the
 * popup as a native window instead of handing the URL off to the system browser. The desktop only
 * captures a popup while an OAuth session is active (`global.oauthProcess`); without this signal the
 * window escapes to the default browser. No-op on web, where `invokeInboxDesktopIPC` resolves
 * immediately.
 *
 * Pair every call with {@link notifyDesktopOAuthPopupFinished} once the popup resolves so the
 * desktop clears the session.
 */
export const notifyDesktopOAuthPopupStarted = (authorizationUrl: string, sessionId: string) =>
    hasInboxDesktopFeature('OAuthPopupV2')
        ? invokeInboxDesktopIPC({
              type: 'oauthPopupOpenedV2',
              payload: { action: 'oauthPopupStarted', authorizationUrl, sessionId },
          })
        : invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupStarted' });

/** Counterpart to {@link notifyDesktopOAuthPopupStarted}: signals the popup has closed. */
export const notifyDesktopOAuthPopupFinished = (sessionId: string) =>
    hasInboxDesktopFeature('OAuthPopupV2')
        ? invokeInboxDesktopIPC({
              type: 'oauthPopupOpenedV2',
              payload: { action: 'oauthPopupFinished', sessionId },
          })
        : invokeInboxDesktopIPC({ type: 'oauthPopupOpened', payload: 'oauthPopupFinished' });
