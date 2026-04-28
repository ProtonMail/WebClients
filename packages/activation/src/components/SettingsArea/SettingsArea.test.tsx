import { screen } from '@testing-library/dom';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { APPS } from '@proton/shared/lib/constants';

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

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;

describe('SettingsArea', () => {
    it('Should render the forward section if feature is enabled', async () => {
        mockUseUser.mockReturnValue([{ Flags: [] }, false]);

        easySwitchRender(<SettingsArea config={{ ...settingsAreaConfig, subsections }} app={APPS.PROTONMAIL} />);

        const gmailInScreen = screen.getByTestId('ProviderButton:googleCardForward');

        screen.getByTestId('SettingsArea:forwardSection');
        expect(gmailInScreen).toBeVisible();
    });
});
