import { screen } from '@testing-library/dom';

import { useUser } from '@proton/components/hooks/useUser';

import { easySwitchRender } from '../../tests/render';
import GmailForwarding from './GmailForwarding';

jest.mock('@proton/components/hooks/useUser');
const mockUseUser = useUser as jest.MockedFunction<any>;

describe('GmailForwarding', () => {
    it('Should be enabled if user is not delinquent', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, false]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward').firstChild;
        expect(gmailForward).toBeEnabled();
    });

    it('Should be disabled if user is delinquent', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: false }, false]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });

    it('Should be disabled if loading user is true', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, true]);

        easySwitchRender(<GmailForwarding />);

        const gmailForward = screen.getByTestId('ProviderCard:googleCardForward');
        expect(gmailForward).toBeDisabled();
    });
});
