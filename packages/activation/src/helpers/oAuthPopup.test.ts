import { renderToStaticMarkup } from 'react-dom/server';

import { vi } from 'vitest';

import { GOOGLE_OAUTH_PATH } from '@proton/shared/lib/api/activation';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';

import { OAUTH_PROVIDER } from '../interface';
import { openOAuthPopup } from './oAuthPopup';

vi.mock('@proton/shared/lib/desktop/ipcHelpers', () => ({
    invokeInboxDesktopIPC: vi.fn(),
    hasInboxDesktopFeature: vi.fn(),
}));
vi.mock('@proton/shared/lib/helpers/uid', () => ({
    generateProtonWebUID: vi.fn(() => 'mock-uid'),
}));
vi.mock('../hooks/useOAuthPopup.helpers', () => ({
    getProviderNumber: vi.fn(() => 42),
}));

const mockCreateNotification = vi.fn();
vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({
        createNotification: mockCreateNotification,
    }),
}));

const mockCallback = vi.fn();

const setupWindowOpen = (override: Partial<Window> = {}) => {
    const mockWindow: any = {
        document: {
            URL: '',
        },
        close: vi.fn(),
        focus: vi.fn(),
        closed: false,
        ...override,
    };

    window.open = vi.fn(() => mockWindow);
    return mockWindow;
};

describe('openOAuthPopup', () => {
    const redirectUri = 'https://account.proton.me/oauth/callback';
    const authorizationUrl = `https://account.proton,me${GOOGLE_OAUTH_PATH}?proton_feature=byoe&redirect_uri=${encodeURIComponent(redirectUri)}`;
    const errorMessage = 'Something went wrong';

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
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

        vi.advanceTimersByTime(200);

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

        vi.advanceTimersByTime(200);

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

        vi.advanceTimersByTime(200);

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
        vi.advanceTimersByTime(200);

        expect(invokeInboxDesktopIPC).toHaveBeenCalledWith({
            type: 'oauthPopupOpened',
            payload: 'oauthPopupFinished',
        });
    });
});
