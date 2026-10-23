import { renderHook } from '@testing-library/react';

import { useHasRedeemedCoupons } from '@proton/payments-ui/client-extensions/useHasRedeemedCoupons';
import { BLACK_FRIDAY_2026_COUPONS } from '@proton/payments/core/subscription/helpers';

import type { OfferConfig, Operation } from '../interface';
import { useOffer as useDuoToFamily } from './blackFriday2026DuoToFamily/useOffer';
import { useOffer as useFreeToDrivePlus } from './blackFriday2026FreeToDrivePlus/useOffer';
import { useOffer as useFreeToMailPlus } from './blackFriday2026FreeToMailPlus/useOffer';
import { useOffer as useFreeToPassPlus } from './blackFriday2026FreeToPassPlus/useOffer';
import { useOffer as useFreeToUnlimited } from './blackFriday2026FreeToUnlimited/useOffer';
import { useOffer as usePlusToUnlimited } from './blackFriday2026PlusToUnlimited/useOffer';
import { useOffer as useUnlimitedToDuo } from './blackFriday2026UnlimitedToDuo/useOffer';
import { useBlackFriday2026 } from './blackFriday2026configs';

jest.mock('./blackFriday2026UnlimitedToDuo/useOffer', () => ({ useOffer: jest.fn() }));
jest.mock('./blackFriday2026DuoToFamily/useOffer', () => ({ useOffer: jest.fn() }));
jest.mock('./blackFriday2026PlusToUnlimited/useOffer', () => ({ useOffer: jest.fn() }));
jest.mock('./blackFriday2026FreeToUnlimited/useOffer', () => ({ useOffer: jest.fn() }));
jest.mock('./blackFriday2026FreeToMailPlus/useOffer', () => ({ useOffer: jest.fn() }));
jest.mock('./blackFriday2026FreeToDrivePlus/useOffer', () => ({ useOffer: jest.fn() }));
jest.mock('./blackFriday2026FreeToPassPlus/useOffer', () => ({ useOffer: jest.fn() }));

jest.mock('@proton/payments-ui/client-extensions/useHasRedeemedCoupons', () => ({ useHasRedeemedCoupons: jest.fn() }));
const mockUseHasRedeemed = useHasRedeemedCoupons as jest.Mock;

const useOffers = [
    useUnlimitedToDuo,
    useDuoToFamily,
    usePlusToUnlimited,
    useFreeToUnlimited,
    useFreeToMailPlus,
    useFreeToDrivePlus,
    useFreeToPassPlus,
] as jest.Mock[];

const buildOperation = (overrides: Partial<Operation> = {}): Operation => {
    return {
        isValid: false,
        isLoading: false,
        isEligible: false,
        config: {} as OfferConfig,
        ...overrides,
    };
};

/**
 * Every offer starts invalid; `freeToUnlimited` takes the given state so a single candidate can be set up.
 */
const setFreeToUnlimited = (overrides: Partial<Operation>) => {
    useOffers.forEach((useOffer) => {
        useOffer.mockReturnValue(buildOperation());
    });
    (useFreeToUnlimited as jest.Mock).mockReturnValue(buildOperation({ isEligible: true, ...overrides }));
};

describe('useBlackFriday2026', () => {
    beforeEach(() => {
        mockUseHasRedeemed.mockReturnValue({ hasRedeemed: false, loading: false });
    });

    it('does not check redemptions when no offer would show', () => {
        setFreeToUnlimited({ isValid: false });

        renderHook(() => useBlackFriday2026());

        expect(mockUseHasRedeemed).toHaveBeenCalledWith({ coupons: BLACK_FRIDAY_2026_COUPONS, enabled: false });
    });

    it('does not check redemptions while the offers are still loading', () => {
        setFreeToUnlimited({ isValid: true, isLoading: true });

        renderHook(() => useBlackFriday2026());

        expect(mockUseHasRedeemed).toHaveBeenCalledWith({ coupons: BLACK_FRIDAY_2026_COUPONS, enabled: false });
    });

    it('checks redemptions when an offer would show', () => {
        setFreeToUnlimited({ isValid: true });

        renderHook(() => useBlackFriday2026());

        expect(mockUseHasRedeemed).toHaveBeenCalledWith({ coupons: BLACK_FRIDAY_2026_COUPONS, enabled: true });
    });

    it('keeps the offer valid when no BF 2026 coupon has been redeemed', () => {
        setFreeToUnlimited({ isValid: true });

        const { result } = renderHook(() => useBlackFriday2026());

        expect(result.current.filter((operation) => operation.isValid)).toHaveLength(1);
    });

    it('invalidates every offer once a BF 2026 coupon has been redeemed', () => {
        setFreeToUnlimited({ isValid: true });
        mockUseHasRedeemed.mockReturnValue({ hasRedeemed: true, loading: false });

        const { result } = renderHook(() => useBlackFriday2026());

        expect(result.current.some((operation) => operation.isValid)).toBe(false);
    });

    it('reports every offer as loading while the redemption history loads', () => {
        setFreeToUnlimited({ isValid: true });
        mockUseHasRedeemed.mockReturnValue({ hasRedeemed: false, loading: true });

        const { result } = renderHook(() => useBlackFriday2026());

        expect(result.current.every((operation) => operation.isLoading)).toBe(true);
    });
});
