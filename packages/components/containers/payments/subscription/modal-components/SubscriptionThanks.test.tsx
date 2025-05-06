import { render, screen } from '@testing-library/react';

import useConfig from '@proton/components/hooks/useConfig';
import { PLANS } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { MAIL_MOBILE_APP_LINKS } from '@proton/shared/lib/mail/constants';
import { VPN_MOBILE_APP_LINKS } from '@proton/shared/lib/vpn/constants';

import SubscriptionThanks from './SubscriptionThanks';

// Mock the useConfig hook
jest.mock('@proton/components/hooks/useConfig');

describe('SubscriptionThanks', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useConfig as jest.Mock).mockReturnValue({ APP_NAME: APPS.PROTONMAIL });
    });

    it('renders mail version correctly with download links', () => {
        render(<SubscriptionThanks onClose={mockOnClose} planIDs={{}} />);

        // Check main elements
        expect(screen.getByTestId('successfull-update')).toHaveTextContent('Account successfully updated');
        expect(screen.getByTestId('more-info')).toHaveTextContent(
            'Download your favorite app today and take privacy with you everywhere you go.'
        );

        // Check app store links
        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', MAIL_MOBILE_APP_LINKS.playStore);
        expect(links[1]).toHaveAttribute('href', MAIL_MOBILE_APP_LINKS.appStore);
    });

    it('renders VPN version correctly with download links', () => {
        (useConfig as jest.Mock).mockReturnValue({ APP_NAME: APPS.PROTONVPN_SETTINGS });

        render(<SubscriptionThanks onClose={mockOnClose} planIDs={{}} />);

        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', VPN_MOBILE_APP_LINKS.playStore);
        expect(links[1]).toHaveAttribute('href', VPN_MOBILE_APP_LINKS.appStore);
    });

    it('shows different message for VPN business plans', () => {
        render(<SubscriptionThanks onClose={mockOnClose} planIDs={{ [PLANS.VPN_PRO]: 1 }} />);

        expect(screen.getByTestId('more-info')).toHaveTextContent(
            'Thank you for subscribing. Secure browsing starts now.'
        );
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<SubscriptionThanks onClose={mockOnClose} planIDs={{}} />);

        const closeButton = screen.getByText('Close', { selector: 'button' });
        closeButton.click();

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
