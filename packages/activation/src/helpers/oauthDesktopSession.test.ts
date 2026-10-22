import { hasInboxDesktopFeature, invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';

import { notifyDesktopOAuthPopupFinished, notifyDesktopOAuthPopupStarted } from './oauthDesktopSession';

jest.mock('@proton/shared/lib/desktop/ipcHelpers', () => ({
    invokeInboxDesktopIPC: jest.fn(),
    hasInboxDesktopFeature: jest.fn(),
}));
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    getIsIframe: jest.fn(),
}));

const AUTHORIZATION_URL = 'https://zoom.example/oauth/authorize?client_id=client';
const SESSION_ID = 'session-id';

const setupEnvironment = ({ hasV2Feature, isIframe }: { hasV2Feature: boolean; isIframe: boolean }) => {
    jest.mocked(hasInboxDesktopFeature).mockReturnValue(hasV2Feature);
    jest.mocked(getIsIframe).mockReturnValue(isIframe);
};

describe('oauthDesktopSession', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        { description: 'a top frame with the V2 feature', hasV2Feature: true, isIframe: false },
        { description: 'an iframe without access to the desktop feature check', hasV2Feature: false, isIframe: true },
    ])('sends V2 messages from $description', async ({ hasV2Feature, isIframe }) => {
        setupEnvironment({ hasV2Feature, isIframe });

        await notifyDesktopOAuthPopupStarted(AUTHORIZATION_URL, SESSION_ID);
        await notifyDesktopOAuthPopupFinished(SESSION_ID);

        expect(invokeInboxDesktopIPC).toHaveBeenNthCalledWith(1, {
            type: 'oauthPopupOpenedV2',
            payload: { action: 'oauthPopupStarted', authorizationUrl: AUTHORIZATION_URL, sessionId: SESSION_ID },
        });
        expect(invokeInboxDesktopIPC).toHaveBeenNthCalledWith(2, {
            type: 'oauthPopupOpenedV2',
            payload: { action: 'oauthPopupFinished', sessionId: SESSION_ID },
        });
    });

    it('sends legacy messages from a top frame without the V2 feature', async () => {
        setupEnvironment({ hasV2Feature: false, isIframe: false });

        await notifyDesktopOAuthPopupStarted(AUTHORIZATION_URL, SESSION_ID);
        await notifyDesktopOAuthPopupFinished(SESSION_ID);

        expect(invokeInboxDesktopIPC).toHaveBeenNthCalledWith(1, {
            type: 'oauthPopupOpened',
            payload: 'oauthPopupStarted',
        });
        expect(invokeInboxDesktopIPC).toHaveBeenNthCalledWith(2, {
            type: 'oauthPopupOpened',
            payload: 'oauthPopupFinished',
        });
    });
});
