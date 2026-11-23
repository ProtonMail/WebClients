import { render, screen } from '@testing-library/react';

import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { OfferTopBanner } from './OfferTopBanner';
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
        variant: CampaignVariant.BANNER,
        cta: { text: 'Get the deal', kind: 'internal' },
        message: { title: 'One plan, full power', body: 'Feature one', ctaText: 'Get the deal', imageUrl: null },
    },
    onAction: vi.fn(),
    onDismiss: vi.fn(),
    seenRef: vi.fn(),
    reportSeen: vi.fn(),
};

describe('OfferTopBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOfferUpgrade.mockReturnValue(sharedOnUpgrade);
    });

    it('asks for the banner campaign with the shared upgrade handler', () => {
        mockUseActiveOffer.mockReturnValue(null);

        render(<OfferTopBanner />);

        expect(mockUseActiveOffer).toHaveBeenCalledWith(CampaignVariant.BANNER, { onUpgrade: sharedOnUpgrade });
        expect(mockUseOfferUpgrade).toHaveBeenCalledWith(UPSELL_COMPONENT.BANNER);
    });

    it("uses the host's upgrade handler when given one", () => {
        mockUseActiveOffer.mockReturnValue(null);
        const hostOnUpgrade = vi.fn();

        render(<OfferTopBanner onUpgrade={hostOnUpgrade} />);

        expect(mockUseActiveOffer).toHaveBeenCalledWith(CampaignVariant.BANNER, { onUpgrade: hostOnUpgrade });
    });

    it('renders nothing without an offer', () => {
        mockUseActiveOffer.mockReturnValue(null);

        const { container } = render(<OfferTopBanner />);

        expect(container.innerHTML).toBe('');
    });

    it('renders the offer banner', () => {
        mockUseActiveOffer.mockReturnValue(offer);

        render(<OfferTopBanner />);

        expect(screen.getByTestId('offer-banner:body').textContent).toBe('Feature one');
        expect(screen.getByTestId('offer-banner:cta').textContent).toBe('Get the deal');
    });
});
