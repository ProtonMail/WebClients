import { screen } from '@testing-library/dom';

import { useUser } from '@proton/account/user/hooks';
import { APPS } from '@proton/shared/lib/constants';

import { easySwitchRender } from '../../tests/render';
import SettingsArea from './SettingsArea';

const settingsAreaConfig = {
    text: 'Import via Easy Switch',
    to: '/easy-switch',
    icon: 'arrow-down-to-square',
    available: true,
};

const subsections = [
    {
        id: 'easy-switch',
    },
    {
        text: 'History',
        id: 'import-list',
    },
];

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;

describe('SettingsArea', () => {
    it('Should render the forward section if feature is enabled', async () => {
        mockUseUser.mockReturnValue([{ Flags: [] }, false]);

        easySwitchRender(<SettingsArea config={{ ...settingsAreaConfig, subsections }} app={APPS.PROTONMAIL} />);

        const googleInScreen = screen.getAllByText('Import from Google');
        const gmailInScreen = screen.getByTestId('ProviderButton:googleCardForward');

        screen.getByTestId('SettingsArea:forwardSection');
        expect(googleInScreen).toHaveLength(1);
        expect(gmailInScreen).toBeVisible();
    });
});
