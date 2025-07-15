import { renderToStaticMarkup } from 'react-dom/server';

import { openOAuthPopup } from '@proton/activation/src/helpers/oAuthPopup';
import { OAUTH_PROVIDER } from '@proton/activation/src/interface';
import { GOOGLE_OAUTH_PATH } from '@proton/shared/lib/api/activation';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

jest.mock('@proton/shared/lib/desktop/ipcHelpers', () => ({
    invokeInboxDesktopIPC: jest.fn(),
}));
jest.mock('@proton/shared/lib/helpers/uid', () => ({
    generateProtonWebUID: jest.fn(() => 'mock-uid'),
}));
jest.mock('@proton/activation/src/hooks/useOAuthPopup.helpers', () => ({
    getProviderNumber: jest.fn(() => 42),
}));

const mockCreateNotification = jest.fn();
jest.mock('@proton/components/hooks/useNotifications', () => {
    return () => ({
        createNotification: mockCreateNotification,
    });
});

const mockCallback = jest.fn();

const setupWindowOpen = (override: Partial<Window> = {}) => {
    const mockWindow: any = {
        document: {
            URL: '',
        },
        close: jest.fn(),
        focus: jest.fn(),
        closed: false,
        ...override,
    };

    window.open = jest.fn(() => mockWindow);
    return mockWindow;
};

describe('openOAuthPopup', () => {
    const redirectUri = 'https://account.proton.me/oauth/callback';
    const authorizationUrl = `https://account.proton,me${GOOGLE_OAUTH_PATH}?proton_feature=byoe&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const errorMessage = 'Something went wrong';

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should open a popup with correct parameters', async () => {
        const mockWindow = setupWindowOpen();

        await openOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            authorizationUrl,
            redirectUri,
            errorMessage,
            callback: mockCallback,
        });

        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining(`${authorizationUrl}&state=mock-uid`),
            'oauthPopup',
            expect.stringContaining('width=500')
        );

        expect(mockWindow.focus).toHaveBeenCalled();
    });

    it('it should trigger callback when oAuth flow has been completed', async () => {
        const mockWindow = setupWindowOpen({
            document: {
                URL: `${redirectUri}?code=123&state=mock-uid`,
            } as Document,
        });

        await openOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            authorizationUrl,
            redirectUri,
            errorMessage,
            callback: mockCallback,
        });

        jest.advanceTimersByTime(200);

        expect(mockWindow.close).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalledWith({
            Code: '123',
            Provider: 42,
            RedirectUri: redirectUri,
        });
    });

    it('it should show an error notification when getting an error from oAuth flow', async () => {
        setupWindowOpen({
            document: {
                URL: `${redirectUri}?error=access_denied&state=mock-uid`,
            } as Document,
        });

        await openOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            authorizationUrl,
            redirectUri,
            errorMessage,
            callback: mockCallback,
        });

        jest.advanceTimersByTime(200);

        // Notification content contains a React element, so we need to check the text manually
        const notificationCall = mockCreateNotification.mock.calls[0][0];
        expect(notificationCall.type).toBe('error');
        const renderedHtml = renderToStaticMarkup(notificationCall.text);
        expect(renderedHtml).toContain(errorMessage);

        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should show an error notification when state uid is different', async () => {
        setupWindowOpen({
            document: {
                URL: `${redirectUri}?code=123&state=invalid-state`,
            } as Document,
        });

        await openOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            authorizationUrl,
            redirectUri,
            errorMessage,
            callback: mockCallback,
        });

        jest.advanceTimersByTime(200);

        // Notification content contains a React element, so we need to check the text manually
        const notificationCall = mockCreateNotification.mock.calls[0][0];
        expect(notificationCall.type).toBe('error');
        const renderedHtml = renderToStaticMarkup(notificationCall.text);
        expect(renderedHtml).toContain(errorMessage);

        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should clear interval when oAuth popup is closed', async () => {
        const mockWindow = setupWindowOpen();

        await openOAuthPopup({
            provider: OAUTH_PROVIDER.GOOGLE,
            authorizationUrl,
            redirectUri,
            errorMessage,
            callback: mockCallback,
        });

        mockWindow.closed = true;
        jest.advanceTimersByTime(200);

        expect(invokeInboxDesktopIPC).toHaveBeenCalledWith({
            type: 'oauthPopupOpened',
            payload: 'oauthPopupFinished',
        });
    });
});
