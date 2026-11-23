import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';

import { CampaignVariant } from '../interface';
import { type ActiveOffer, useActiveOffer } from './useActiveOffer';
import { useOfferNavbarEntry } from './useOfferNavbarEntry';
import { useOfferUpgrade } from './useOfferUpgrade';

vi.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: () => ({
        viewportWidth: { '<=small': false, '>=large': true },
    }),
}));
vi.mock('./useActiveOffer', () => ({ useActiveOffer: vi.fn() }));
vi.mock('./useOfferUpgrade', () => ({ useOfferUpgrade: vi.fn() }));

const mockUseActiveOffer = vi.mocked(useActiveOffer);
const mockUseOfferUpgrade = vi.mocked(useOfferUpgrade);
const onUpgrade = vi.fn();

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
            imageUrl: 'https://cdn.proton.me/offer.png',
        },
    },
    onAction: vi.fn(),
    onDismiss: vi.fn(),
    seenRef: vi.fn(),
    reportSeen: vi.fn(),
};

const Host = ({ fallback }: { fallback?: ReactNode }) => {
    const { button, modal } = useOfferNavbarEntry();

    return (
        <>
            {button ?? fallback}
            {modal}
        </>
    );
};

describe('useOfferNavbarEntry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOfferUpgrade.mockReturnValue(onUpgrade);
    });

    it('asks for the modal campaign with the shared upgrade handler', () => {
        mockUseActiveOffer.mockReturnValue(null);

        render(<Host />);

        expect(mockUseActiveOffer).toHaveBeenCalledWith(CampaignVariant.MODAL, { onUpgrade });
        expect(mockUseOfferUpgrade).toHaveBeenCalledWith(UPSELL_COMPONENT.BUTTON);
    });

    it('renders the fallback when there is no offer', () => {
        mockUseActiveOffer.mockReturnValue(null);

        render(<Host fallback={<span>Default upsell</span>} />);

        expect(screen.getByText('Default upsell')).toBeTruthy();
        expect(screen.queryByTestId('offer-navbar-button')).toBeNull();
    });

    it('replaces the fallback with the offer button, which opens the deal modal', () => {
        mockUseActiveOffer.mockReturnValue(offer);

        render(<Host fallback={<span>Default upsell</span>} />);

        expect(screen.queryByText('Default upsell')).toBeNull();
        expect(screen.getByTestId('offer-navbar-button').textContent).toContain('Special Offer');
        expect(screen.queryByTestId('offer-deal-modal:cta')).toBeNull();

        fireEvent.click(screen.getByTestId('offer-navbar-button'));

        expect(screen.getByTestId('offer-deal-modal:cta').textContent).toContain('Get the deal');
    });
});
