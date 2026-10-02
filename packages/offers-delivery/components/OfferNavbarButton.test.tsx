import { fireEvent, render, screen } from '@testing-library/react';

import { CampaignVariant } from '../interface';
import { OfferNavbarButton, type OfferNavbarButtonProps } from './OfferNavbarButton';
import type { ActiveOffer } from './useActiveOffer';

// jsdom can't compute the pseudo-element style the real hook reads breakpoints from.
jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: () => ({
        viewportWidth: { '<=small': false, '>=large': true },
    }),
}));

const makeOffer = (overrides: Partial<ActiveOffer> = {}): ActiveOffer => {
    return {
        campaign: {
            campaignKey: 'campaign-1',
            messageKey: 'message-1',
            startTime: 0,
            endTime: null,
            variant: CampaignVariant.MODAL,
            cta: { text: 'Get the deal', kind: 'internal' },
            message: { title: 'One plan, full power', body: 'Body copy', ctaText: 'Get the deal', imageUrl: null },
        },
        onAction: jest.fn(),
        onDismiss: jest.fn(),
        seenRef: jest.fn(),
        reportSeen: jest.fn(),
        ...overrides,
    };
};

const renderButton = (props: Partial<OfferNavbarButtonProps> = {}) => {
    return render(
        <OfferNavbarButton
            offer={makeOffer()}
            onClick={jest.fn()}
            label="Special Offer"
            icon={null}
            backgroundColor="black"
            color="white"
            {...props}
        />
    );
};

describe('OfferNavbarButton', () => {
    it('reports SEEN via the button', () => {
        const seenRef = jest.fn();
        renderButton({ offer: makeOffer({ seenRef }) });

        expect(seenRef).toHaveBeenCalledWith(screen.getByTestId('offer-navbar-button'));
    });

    it('calls onClick without acting on or dismissing the campaign', () => {
        const offer = makeOffer();
        const onClick = jest.fn();
        renderButton({ offer, onClick });

        fireEvent.click(screen.getByTestId('offer-navbar-button'));

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(offer.onAction).not.toHaveBeenCalled();
        expect(offer.onDismiss).not.toHaveBeenCalled();
    });

    describe('customisation', () => {
        it('applies a background gradient and text colour', () => {
            const gradient = 'linear-gradient(to right, #7f5cff 0%, #6fb0ff 100%)';
            renderButton({ backgroundColor: gradient, color: '#08031f' });
            const button = screen.getByTestId('offer-navbar-button');

            expect(button.style.getPropertyValue('--offer-navbar-button-background')).toBe(gradient);
            expect(button.style.getPropertyValue('--offer-navbar-button-color')).toBe('#08031f');
        });

        it('renders a custom icon before the label', () => {
            renderButton({ icon: <span data-testid="custom-icon" />, label: 'Summer deal' });
            const button = screen.getByTestId('offer-navbar-button');
            const icon = screen.getByTestId('custom-icon');
            const label = screen.getByText('Summer deal');

            expect(button.contains(icon)).toBe(true);
            expect(icon.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it('renders no icon when given null', () => {
            renderButton({ icon: null });

            expect(screen.getByTestId('offer-navbar-button').querySelector('svg')).toBeNull();
        });

        it('keeps a caller className alongside its own', () => {
            renderButton({ className: 'extra' });
            const { classList } = screen.getByTestId('offer-navbar-button');

            expect(classList.contains('offer-navbar-button')).toBe(true);
            expect(classList.contains('extra')).toBe(true);
        });
    });
});
