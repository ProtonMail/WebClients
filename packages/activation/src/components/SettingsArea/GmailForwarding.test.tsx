import { screen } from '@testing-library/dom';

import { useUser } from '@proton/account/user/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag, useGetFlag } from '@proton/unleash';

import { easySwitchRender } from '../../tests/render';
import GmailForwarding from './GmailForwarding';

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as unknown as jest.MockedFunction<any>;

// Needed for upsell config
jest.mock('@proton/unleash/useGetFlag');
const mockUseGetFlag = useGetFlag as jest.Mock;
mockUseGetFlag.mockReturnValue(() => false);

describe('GmailForwarding', () => {
    it('Should be enabled if user is not delinquent', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true, Flags: [] }, false]);

        easySwitchRender(<GmailForwarding app={APPS.PROTONMAIL} />);

        const gmailForward = screen.getByTestId('ProviderButton:googleCardForward').firstChild;
        expect(gmailForward).toBeEnabled();
    });

    it('Should be disabled if user is delinquent', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: false, Flags: [] }, false]);

        easySwitchRender(<GmailForwarding app={APPS.PROTONMAIL} />);

        const gmailForward = screen.getByTestId('ProviderButton:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });

    it('Should be disabled if loading user is true', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true, Flags: [] }, true]);

        easySwitchRender(<GmailForwarding app={APPS.PROTONMAIL} />);

        const gmailForward = screen.getByTestId('ProviderButton:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });

    it('Should be disabled if maintenance mode is enabled', () => {
        mockUseFlag.mockReturnValue(true);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true, Flags: [] }, false]);

        easySwitchRender(<GmailForwarding app={APPS.PROTONMAIL} />);

        const gmailForward = screen.getByTestId('ProviderButton:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });
});
