import { renderHook } from '@testing-library/react';

import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import type { Deal, Offer } from '../interface';
import useOnSelectDeal from './useOnSelectDeal';

const mockGoToSettingsLink = vi.fn();
const mockOpenSubscriptionModal = vi.fn();

let mockHasInAppPayment = false;

vi.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({ APP_NAME: APPS.PROTONMAIL }),
}));

vi.mock('../../../components/link/useSettingsLink', () => ({
    __esModule: true,
    default: () => mockGoToSettingsLink,
}));

vi.mock('../../desktop/useHasInboxDesktopInAppPayments', () => ({
    useHasInboxDesktopInAppPayments: () => false,
}));

vi.mock('../../payments/subscription/subscriptionModalContext', () => ({
    useOptionalSubscriptionModal: () => [mockHasInAppPayment ? mockOpenSubscriptionModal : undefined, false],
}));

vi.mock('@proton/shared/lib/helpers/desktop', () => ({
    isElectronApp: false,
    isElectronMail: false,
}));

global.fetch = vi.fn(() => Promise.resolve({} as Response));

describe('useOnSelectDeal', () => {
    const offer = { ID: 'go-unlimited-2022', enableCycleSelector: true } as Offer;
    const deal = {
        ref: 'offer_ref_123',
        cycle: CYCLE.YEARLY,
        planIDs: { mail2022: 1 },
        couponCode: COUPON_CODES.BLACK_FRIDAY_2025,
    } as Deal;

    beforeEach(() => {
        vi.clearAllMocks();
        mockHasInAppPayment = false;
    });

    it('redirects to settings with the offer params in the URL when in-app payment is unavailable', () => {
        const { result } = renderHook(() => useOnSelectDeal());

        result.current(offer, deal, 'EUR');

        expect(mockGoToSettingsLink).toHaveBeenCalledTimes(1);
        const url = mockGoToSettingsLink.mock.calls[0][0] as string;
        const params = new URLSearchParams(url.split('?')[1]);

        expect(url.startsWith('/dashboard?')).toBe(true);
        expect(params.get('cycle')).toBe(`${CYCLE.YEARLY}`);
        expect(params.get('currency')).toBe('EUR');
        expect(params.get('coupon')).toBe(COUPON_CODES.BLACK_FRIDAY_2025);
        expect(params.get('plan')).toBe('mail2022');
        expect(params.get('fixedPlan')).toBe('true');
        expect(params.has('fixedCycle')).toBe(false);
        expect(params.get('ref')).toBe('offer_ref_123');
    });

    it('does not call the settings link when in-app payment is used instead', () => {
        mockHasInAppPayment = true;
        const { result } = renderHook(() => useOnSelectDeal());

        result.current(offer, deal, 'EUR');

        expect(mockOpenSubscriptionModal).toHaveBeenCalledTimes(1);
        expect(mockGoToSettingsLink).not.toHaveBeenCalled();
    });

    it('calls the optional callback after redirecting to settings', () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useOnSelectDeal(callback));

        result.current(offer, deal, 'EUR');

        expect(callback).toHaveBeenCalledTimes(1);
    });
});
