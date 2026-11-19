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
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: vi.fn() }));

describe('SettingsArea', () => {
    beforeEach(() => {
        restriction.isRestricted = false;
        vi.mocked(useFlag).mockReturnValue(false);
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
});
