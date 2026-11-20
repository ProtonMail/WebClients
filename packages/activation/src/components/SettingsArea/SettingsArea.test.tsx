import { screen } from '@testing-library/dom';
import { c } from 'ttag';
import { type MockedFunction, vi } from 'vitest';

import { useUser } from '@proton/account/user/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { easySwitchRender } from '../../tests/render';
import SettingsArea from './SettingsArea';

const settingsAreaConfig = {
    text: 'Easy Switch',
    to: '/easy-switch',
    icon: 'arrow-down-to-square',
    available: true,
};

const subsections = [
    {
        id: 'easy-switch',
    },
    {
        text: c('Title').t`Imports`,
        id: 'import-list',
        invisibleTitle: true,
    },
    {
        text: c('Title').t`Connected emails`,
        id: 'forwarding-list',
        invisibleTitle: true,
    },
];

vi.mock('@proton/account/user/hooks');
const mockUseUser = useUser as MockedFunction<any>;

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));
const mockUseFlag = useFlag as MockedFunction<any>;

const mockFlags = (enabledFlags: string[]) => {
    mockUseFlag.mockImplementation((flag: string) => enabledFlags.includes(flag));
};

const byoeUser = { Flags: { 'has-a-byoe-address': true } };
const nonByoeUser = { Flags: { 'has-a-byoe-address': false } };

vi.mock('../../oles/useOLESFeatureStatus', () => ({
    __esModule: true,
    default: () => ({
        featureSupported: false,
        creatingEnabled: false,
        allowedForUser: false,
        isProviderEnabled: () => false,
        loading: false,
    }),
}));

const { restriction } = vi.hoisted(() => ({ restriction: { isRestricted: false } }));
vi.mock('../Modals/OAuth/Drive/useIsDriveImportRestricted', () => ({
    useIsDriveImportRestricted: () => restriction.isRestricted,
}));

describe('SettingsArea', () => {
    beforeEach(() => {
        restriction.isRestricted = false;
        mockFlags([]);
    });

    it('Should render the forward section if feature is enabled', async () => {
        mockUseUser.mockReturnValue([{ Flags: [] }, false]);

        easySwitchRender(<SettingsArea config={{ ...settingsAreaConfig, subsections }} app={APPS.PROTONMAIL} />);

        const gmailInScreen = screen.getByTestId('ProviderButton:googleCardForward');

        screen.getByTestId('SettingsArea:forwardSection');
        expect(gmailInScreen).toBeVisible();
    });

    describe('Drive import section', () => {
        const renderDriveSettings = () => {
            mockUseUser.mockReturnValue([{ Flags: [] }, false]);
            vi.mocked(useFlag).mockReturnValue(true);
            easySwitchRender(<SettingsArea config={{ ...settingsAreaConfig, subsections }} app={APPS.PROTONDRIVE} />);
        };

        it('is shown to non B2B users', () => {
            renderDriveSettings();

            expect(screen.getByTestId('SettingsArea:forwardSection')).toBeInTheDocument();
        });

        it('is hidden from B2B admins and members', () => {
            restriction.isRestricted = true;
            renderDriveSettings();

            expect(screen.queryByTestId('SettingsArea:forwardSection')).not.toBeInTheDocument();
        });
    });

    describe('BYOE new message reminder', () => {
        const renderArea = () => {
            easySwitchRender(<SettingsArea config={{ ...settingsAreaConfig, subsections }} app={APPS.PROTONMAIL} />);
        };

        it('shows the reminder toggle in the connected emails section, above the mailbox list, for a BYOE user when the flag is on', () => {
            mockUseUser.mockReturnValue([byoeUser, false]);
            mockFlags(['InboxByoeNewMessageReminderClient']);

            renderArea();

            const reminder = screen.getByTestId('SettingsArea:byoeReminderSection');
            expect(screen.getByRole('checkbox', { name: 'Private email reminders in Gmail' })).toBeInTheDocument();

            const connectedEmailsSection = document.getElementById('section-forwarding-list');
            expect(connectedEmailsSection).toContainElement(reminder);

            const syncsInfo = screen.getByText(/Connect and manage your external mailboxes/);
            expect(connectedEmailsSection).toContainElement(syncsInfo);
            expect(reminder.compareDocumentPosition(syncsInfo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('hides the reminder toggle when the flag is off', () => {
            mockUseUser.mockReturnValue([byoeUser, false]);
            mockFlags([]);

            renderArea();

            expect(screen.queryByTestId('SettingsArea:byoeReminderSection')).not.toBeInTheDocument();
        });

        it('hides the reminder toggle for a non-BYOE user even when the flag is on', () => {
            mockUseUser.mockReturnValue([nonByoeUser, false]);
            mockFlags(['InboxByoeNewMessageReminderClient']);

            renderArea();

            expect(screen.queryByTestId('SettingsArea:byoeReminderSection')).not.toBeInTheDocument();
        });

        it('keeps the existing sections when the reminder is shown', () => {
            mockUseUser.mockReturnValue([byoeUser, false]);
            mockFlags(['InboxByoeNewMessageReminderClient']);

            renderArea();

            screen.getByTestId('SettingsArea:forwardSection');
            expect(screen.getByTestId('ProviderButton:googleCardForward')).toBeVisible();
        });
    });
});
