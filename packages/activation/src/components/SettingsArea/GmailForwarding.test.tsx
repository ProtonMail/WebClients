import { screen } from '@testing-library/dom';

import { useFlag } from '@proton/components/containers/unleash';
import { useUser } from '@proton/components/hooks/useUser';

import { easySwitchRender } from '../../tests/render';
import GmailForwarding from './GmailForwarding';

jest.mock('@proton/components/hooks/useUser');
const mockUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/components/containers/unleash');
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
