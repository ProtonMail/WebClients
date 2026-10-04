import { fireEvent, screen, waitFor } from '@testing-library/react';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { GmailSyncModal } from '../../../../index';
import { EASY_SWITCH_SOURCES, TIME_PERIOD } from '../../../interface';
import { easySwitchRender } from '../../../tests/render';

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => true),
}));

jest.mock('../../../logic/StoreProvider', () => ({
    __esModule: true,
    default: ({ children }: any) => children,
}));

const mockDispatch = jest.fn();

jest.mock('../../../logic/store', () => ({
    useEasySwitchDispatch: () => mockDispatch,
    useEasySwitchSelector: jest.fn(() => undefined),
}));

jest.mock('../../../hooks/useOAuthPopup', () => ({
    __esModule: true,
    default: () => ({
        triggerOAuthPopup: jest.fn().mockImplementation(async ({ callback }: { callback: Function }) => {
            await callback({ Code: 'auth-code', Provider: 'google', RedirectUri: 'http://redirect' });
        }),
        loadingConfig: false,
    }),
}));

jest.mock('../../../logic/sync/sync.actions', () => ({
    ...jest.requireActual('../../../logic/sync/sync.actions'),
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

    it('should call onBYOECallback with importEmails true when the checkbox is ticked', async () => {
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

        fireEvent.click(screen.getByText('Connect your email'));

        await waitFor(() => {
            expect(mockSyncCallback).not.toHaveBeenCalled();
            expect(mockBYOEWithImportCallback).toHaveBeenCalledWith(false, true, TIME_PERIOD.BIG_BANG, undefined);
        });
    });

    it('should call onBYOECallback with importEmails false when the checkbox is unticked', async () => {
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

        // Untick the import checkbox to connect without importing recent emails
        fireEvent.click(screen.getByTestId('AddBYOEModal:importCheckbox'));
        fireEvent.click(screen.getByText('Connect your email'));

        await waitFor(() => {
            expect(mockSyncCallback).not.toHaveBeenCalled();
            expect(mockBYOEWithImportCallback).toHaveBeenCalledWith(false, false, undefined, undefined);
        });
    });
    it('should call onBYOECallback with the selected import period', async () => {
        const mockBYOEWithImportCallback = jest.fn();

        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                hasAccessToBYOE
                onBYOECallback={mockBYOEWithImportCallback}
            />
        );

        fireEvent.click(screen.getByText('Import all messages'));
        fireEvent.click(screen.getByText('Last 3 months only'));
        fireEvent.click(screen.getByText('Connect your email'));

        await waitFor(() => {
            expect(mockBYOEWithImportCallback).toHaveBeenCalledWith(false, true, TIME_PERIOD.LAST_3_MONTHS, undefined);
        });
    });
});
