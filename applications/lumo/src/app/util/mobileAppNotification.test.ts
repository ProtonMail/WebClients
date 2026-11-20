import type { Mock } from 'vitest';

import { notifyMobileAppLoaded, resetMobileAppNotificationFlag } from './mobileAppNotification';

// Locks the web→native readiness contract: iOS dismisses its loading placeholder when it
// receives a `LUMO_APP_LOADED` message on the `lumoApp` script-message handler. Renaming the
// handler or the message `type` here would silently break the iOS app (it would fall back to
// the safety timeout and show a blank web view on slow networks), so this guards both names.
describe('notifyMobileAppLoaded', () => {
    let postMessage: Mock;

    beforeEach(() => {
        vi.useFakeTimers();
        resetMobileAppNotificationFlag();
        postMessage = vi.fn();
        (window as any).webkit = { messageHandlers: { lumoApp: { postMessage } } };
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (window as any).webkit;
    });

    it('posts a LUMO_APP_LOADED message to the iOS lumoApp handler after the delay', () => {
        notifyMobileAppLoaded(150);

        expect(postMessage).not.toHaveBeenCalled();

        vi.advanceTimersByTime(150);

        expect(postMessage).toHaveBeenCalledTimes(1);
        expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'LUMO_APP_LOADED' }));
    });

    it('notifies the native app only once even if called multiple times', () => {
        notifyMobileAppLoaded(0);
        notifyMobileAppLoaded(0);

        vi.advanceTimersByTime(0);

        expect(postMessage).toHaveBeenCalledTimes(1);
    });
});
