import { screen } from '@testing-library/dom';

import { useUser } from '@proton/account/user/hooks';
import { useFlag } from '@proton/unleash';

import { easySwitchRender } from '../../tests/render';
import GmailForwarding from './GmailForwarding';

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/unleash');
const mockUseFlag = useFlag as unknown as jest.MockedFunction<any>;

describe('GmailForwarding', () => {
    it('Should be enabled if user is not delinquent', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, false]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward').firstChild;
        expect(gmailForward).toBeEnabled();
    });

    it('Should be disabled if user is delinquent', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: false }, false]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });

    it('Should be disabled if loading user is true', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, true]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });

    it('Should be disabled if maintenance mode is enabled', () => {
        mockUseFlag.mockReturnValue(true);
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, false]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });
});
