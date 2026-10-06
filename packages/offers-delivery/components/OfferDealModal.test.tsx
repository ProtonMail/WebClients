import { fireEvent, render, screen } from '@testing-library/react';

import { CampaignVariant } from '../interface';
import { OfferDealModal } from './OfferDealModal';
import type { ActiveOffer } from './useActiveOffer';

const makeOffer = (overrides: Partial<ActiveOffer> = {}): ActiveOffer => {
    return {
        campaign: {
            campaignKey: 'campaign-1',
            messageKey: 'message-1',
            startTime: 0,
            endTime: null,
            variant: CampaignVariant.MODAL,
            cta: { text: 'Upgrade now', kind: 'internal' },
            message: {
                title: 'Testing offer',
                body: 'Please buy this offer',
                ctaText: 'Upgrade now',
                imageUrl: 'https://cdn.proton.me/offer.png',
            },
        },
        onAction: jest.fn(),
        onDismiss: jest.fn(),
        seenRef: jest.fn(),
        reportSeen: jest.fn(),
        ...overrides,
    };
};

describe('OfferDealModal', () => {
    it('renders the campaign image, title, body and CTA text', () => {
        render(<OfferDealModal offer={makeOffer()} />);

        expect(screen.queryByRole('heading', { name: 'Testing offer', hidden: true })).not.toBeNull();
        expect(screen.queryByText('Please buy this offer')).not.toBeNull();
        expect(screen.getByTestId('offer-deal-modal:cta').textContent).toBe('Upgrade now');
        expect(document.querySelector('img')?.getAttribute('src')).toBe('https://cdn.proton.me/offer.png');
    });

    it('renders each line of the body as a ticked feature, skipping blank lines', () => {
        const offer = makeOffer();
        offer.campaign.message.body =
            '2TB of storage to share\n2 user accounts\n\nAll premium features from your current plan';
        render(<OfferDealModal offer={offer} />);

        const items = screen.getAllByRole('listitem', { hidden: true });

        expect(items.map((item) => item.textContent)).toEqual([
            '2TB of storage to share',
            '2 user accounts',
            'All premium features from your current plan',
        ]);
        expect(items.every((item) => item.querySelector('svg') !== null)).toBe(true);
    });

    it('shows the renewal notice', () => {
        render(<OfferDealModal offer={makeOffer()} />);

        expect(screen.queryByText(/Your subscription will renew at the standard annual rate/)).not.toBeNull();
    });

    it('routes the CTA through onAction and closes, without dismissing', () => {
        const offer = makeOffer();
        const onClose = jest.fn();
        render(<OfferDealModal offer={offer} onClose={onClose} />);

        fireEvent.click(screen.getByTestId('offer-deal-modal:cta'));

        expect(offer.onAction).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(offer.onDismiss).not.toHaveBeenCalled();
    });

    it('closes without dismissing, so the entry point stays', () => {
        const offer = makeOffer();
        const onClose = jest.fn();
        render(<OfferDealModal offer={offer} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(offer.onDismiss).not.toHaveBeenCalled();
    });

    it('dismisses the campaign and closes on "Don\'t show this offer again"', () => {
        const offer = makeOffer();
        const onClose = jest.fn();
        render(<OfferDealModal offer={offer} onClose={onClose} />);

        fireEvent.click(screen.getByTestId('offer-deal-modal:dismiss'));

        expect(offer.onDismiss).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(offer.onAction).not.toHaveBeenCalled();
    });

    it('leaves SEEN to the entry point', () => {
        const offer = makeOffer();
        render(<OfferDealModal offer={offer} />);

        expect(offer.seenRef).not.toHaveBeenCalled();
        expect(offer.reportSeen).not.toHaveBeenCalled();
    });
});
