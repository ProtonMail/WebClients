import { fireEvent, screen, waitFor } from '@testing-library/react';

import { GmailSyncModal } from '@proton/activation/index';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

jest.mock('@proton/activation/src/logic/StoreProvider', () => ({
    __esModule: true,
    default: ({ children }: any) => children,
}));

const mockDispatch = jest.fn();

jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: () => mockDispatch,
    useEasySwitchSelector: jest.fn(() => undefined),
}));

jest.mock('@proton/activation/src/hooks/useOAuthPopup', () => ({
    __esModule: true,
    default: () => ({
        triggerOAuthPopup: jest.fn().mockImplementation(async ({ callback }: { callback: Function }) => {
            await callback({ Code: 'auth-code', Provider: 'google', RedirectUri: 'http://redirect' });
        }),
        loadingConfig: false,
    }),
}));

jest.mock('@proton/activation/src/logic/sync/sync.actions', () => ({
    ...jest.requireActual('@proton/activation/src/logic/sync/sync.actions'),
    changeCreateLoadingState: jest.fn(),
    createSyncItem: jest.fn(() => ({ type: 'sync/create/fulfilled' })),
    createTokenItem: jest.fn(() => ({ type: 'token/create/fulfilled' })),
}));

describe('GmailSyncModal', () => {
    beforeEach(() => {
        mockDispatch.mockImplementation((action: any) => action);
    });

    it('should show the add byoe modal', () => {
        easySwitchRender(<GmailSyncModal open source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} hasAccessToBYOE />);

        screen.getByText(`Bring your Gmail into ${MAIL_APP_NAME}`);
    });

    it('should show the forwarding modal', () => {
        easySwitchRender(
            <GmailSyncModal open source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS} hasAccessToBYOE={false} />
        );

        screen.getByText('Automatically forward');
    });

    it('should call onBYOECallback', async () => {
        const mockSyncCallback = jest.fn();
        const mockBYOEWithImportCallback = jest.fn();

        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                hasAccessToBYOE
                onSyncCallback={mockSyncCallback}
                onBYOECallback={mockBYOEWithImportCallback}
            />
        );

        fireEvent.click(screen.getByText('Connect to Gmail'));

        await waitFor(() => {
            expect(mockSyncCallback).not.toHaveBeenCalled();
            expect(mockBYOEWithImportCallback).toHaveBeenCalled();
        });
    });
});
