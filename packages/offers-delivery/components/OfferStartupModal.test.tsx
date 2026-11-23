import { act, render, screen } from '@testing-library/react';

import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferStartupModal } from './OfferStartupModal';
import { type ActiveOffer, useActiveOffer } from './useActiveOffer';
import { useOfferUpgrade } from './useOfferUpgrade';

vi.mock('./useActiveOffer', () => ({ useActiveOffer: vi.fn() }));
vi.mock('./useOfferUpgrade', () => ({ useOfferUpgrade: vi.fn() }));

const mockUseActiveOffer = vi.mocked(useActiveOffer);
const mockUseOfferUpgrade = vi.mocked(useOfferUpgrade);
const sharedOnUpgrade = vi.fn();

const offer: ActiveOffer = {
    campaign: {
        campaignKey: 'campaign-1',
        messageKey: 'message-1',
        startTime: 0,
        endTime: null,
        variant: CampaignVariant.MODAL,
        cta: { text: 'Get the deal', kind: 'internal' },
        message: {
            title: 'One plan, full power',
            body: 'Feature one',
            ctaText: 'Get the deal',
            imageUrl: 'https://example.com/offer.png',
        },
    },
    onAction: vi.fn(),
    onDismiss: vi.fn(),
    seenRef: vi.fn(),
    reportSeen: vi.fn(),
};

describe('OfferStartupModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOfferUpgrade.mockReturnValue(sharedOnUpgrade);
    });

    it('asks for the modal campaign with the shared upgrade handler and renders nothing without one', () => {
        mockUseActiveOffer.mockReturnValue(null);

        render(<OfferStartupModal />);

        expect(mockUseActiveOffer).toHaveBeenCalledWith(CampaignVariant.MODAL, { onUpgrade: sharedOnUpgrade });
        expect(mockUseOfferUpgrade).toHaveBeenCalledWith(UPSELL_COMPONENT.MODAL);
        expect(screen.queryByTestId('offer-deal-modal:cta')).toBeNull();
    });

    it('opens the offer modal on its own once a campaign arrives', async () => {
        mockUseActiveOffer.mockReturnValue(null);
        const { rerender } = render(<OfferStartupModal />);

        mockUseActiveOffer.mockReturnValue(offer);
        await act(async () => rerender(<OfferStartupModal />));

        expect((await screen.findByTestId('offer-deal-modal:cta')).textContent).toContain('Get the deal');
    });
});
