import { screen } from '@testing-library/dom';

import { useFeature } from '@proton/features';
import { APPS } from '@proton/shared/lib/constants';

import { easySwitchRender } from '../../tests/render';
import SettingsArea from './SettingsArea';

const settingsAreaConfig = {
    text: 'Import via Easy Switch',
    to: '/easy-switch',
    icon: 'arrow-down-to-square',
    available: true,
    description: 'Complete the transition to privacy with our secure importing and forwarding tools.',
    subsections: [
        {
            text: 'Set up forwarding',
            id: 'start-forward',
        },
        {
            text: 'Import messages',
            id: 'start-import',
        },
        {
            text: 'History',
            id: 'import-list',
        },
    ],
};

jest.mock('@proton/features/useFeature');
const mockUseFeature = useFeature as jest.MockedFunction<any>;

describe('SettingsArea', () => {
    it('Should render a loader while loading feature flag', async () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: true });

        easySwitchRender(<SettingsArea config={settingsAreaConfig} app={APPS.PROTONMAIL} />);

        const forwardSection = screen.queryByTestId('SettingsArea:forwardSection');
        expect(forwardSection).toBeNull();
    });

    it('Should render the forward section if feature is enabled', async () => {
        mockUseFeature.mockReturnValue({ feature: { Value: { GoogleMailSync: true } }, loading: false });

        easySwitchRender(<SettingsArea config={settingsAreaConfig} app={APPS.PROTONMAIL} />);

        const googleInScreen = screen.getAllByText('Google');
        const gmailInScreen = screen.getByTestId('ProviderCard:googleCardForward');

        screen.getByTestId('SettingsArea:forwardSection');
        expect(googleInScreen).toHaveLength(1);
        expect(gmailInScreen).toBeVisible();
    });
});
