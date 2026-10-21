import { renderHook } from '@testing-library/react-hooks';

import { COUPON_CODES, CYCLE } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import type { Deal, Offer } from '../interface';
import useOnSelectDeal from './useOnSelectDeal';

const mockGoToSettingsLink = jest.fn();
const mockOpenSubscriptionModal = jest.fn();

let mockHasInAppPayment = false;

jest.mock('@proton/app-context/useConfig', () => ({
    useConfig: () => ({ APP_NAME: APPS.PROTONMAIL }),
}));

jest.mock('../../../components/link/useSettingsLink', () => ({
    __esModule: true,
    default: () => mockGoToSettingsLink,
}));

jest.mock('../../desktop/useHasInboxDesktopInAppPayments', () => ({
    useHasInboxDesktopInAppPayments: () => false,
}));

jest.mock('../../payments/subscription/SubscriptionModalProvider', () => ({
    useOptionalSubscriptionModal: () => [mockHasInAppPayment ? mockOpenSubscriptionModal : undefined, false],
}));

jest.mock('@proton/shared/lib/helpers/desktop', () => ({
    isElectronApp: false,
    isElectronMail: false,
}));

global.fetch = jest.fn(() => Promise.resolve({} as Response));

describe('useOnSelectDeal', () => {
    const offer = { ID: 'go-unlimited-2022', enableCycleSelector: true } as Offer;
    const deal = {
        ref: 'offer_ref_123',
        cycle: CYCLE.YEARLY,
        planIDs: { mail2022: 1 },
        couponCode: COUPON_CODES.BLACK_FRIDAY_2025,
    } as Deal;

    beforeEach(() => {
        jest.clearAllMocks();
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
        const callback = jest.fn();
        const { result } = renderHook(() => useOnSelectDeal(callback));

        result.current(offer, deal, 'EUR');

        expect(callback).toHaveBeenCalledTimes(1);
    });
});
