import { fireEvent, screen, waitFor } from '@testing-library/react';

import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { mockTracker } from '@proton/telemetry-tracker/testing';

import { EASY_SWITCH_SOURCES, TIME_PERIOD } from '../../../interface';
import { easySwitchRender } from '../../../tests/render';
import GmailSyncModal from './GmailSyncModal';

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(() => true),
}));

jest.mock('@proton/unleash/useVariant', () => ({
    __esModule: true,
    useVariant: jest.fn(() => ({ name: 'Treatment', enabled: true })),
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
        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                onBYOECallback={() => {}}
                hasAccessToBYOE
            />
        );

        screen.getByText(`Bring your Gmail into ${MAIL_APP_NAME}`);
    });

    it('should send creation_started when the BYOE modal is shown, with the source and whether it converts a forwarding', () => {
        const { reports } = mockTracker();

        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                onBYOECallback={() => {}}
                hasAccessToBYOE
                expectedEmailAddress="me@gmail.com"
            />
        );

        expect(reports).toHaveLength(1);
        expect(reports[0]).toMatchObject({
            measurementGroup: 'any.web.byoe_creation_funnel',
            event: 'creation_started',
            dimensions: { source: 'account-web-settings', provider: 'google', isConversion: 'true' },
        });
    });

    it('should not send creation_started for the forwarding modal', () => {
        const { reports } = mockTracker();

        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                onBYOECallback={() => {}}
                hasAccessToBYOE={false}
            />
        );

        expect(reports).toHaveLength(0);
    });

    it('should send google_sign_in_clicked with the import choices when pressing connect', async () => {
        const { reports } = mockTracker();

        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                onBYOECallback={() => {}}
                hasAccessToBYOE
            />
        );
        fireEvent.click(screen.getByText('Connect your email'));

        await waitFor(() => expect(reports.map((report) => report.event)).toContain('google_sign_in_clicked'));
        const click = reports.find((report) => report.event === 'google_sign_in_clicked');
        expect(click?.dimensions).toEqual({
            provider: 'google',
            hasImportEmails: 'true',
            importPeriodSelected: 'big_bang',
            variant: 'treatment',
        });
        expect(click?.values).toHaveProperty('durationMs');
    });

    it('should show the forwarding modal', () => {
        easySwitchRender(
            <GmailSyncModal
                open
                source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
                onBYOECallback={() => {}}
                hasAccessToBYOE={false}
            />
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
            expect(mockBYOEWithImportCallback).toHaveBeenCalledWith({
                hasError: false,
                importEmails: true,
                importPeriod: TIME_PERIOD.BIG_BANG,
                token: undefined,
            });
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
            expect(mockBYOEWithImportCallback).toHaveBeenCalledWith({
                hasError: false,
                importEmails: false,
                importPeriod: undefined,
                token: undefined,
            });
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
            expect(mockBYOEWithImportCallback).toHaveBeenCalledWith({
                hasError: false,
                importEmails: true,
                importPeriod: TIME_PERIOD.LAST_3_MONTHS,
                token: undefined,
            });
        });
    });
});
