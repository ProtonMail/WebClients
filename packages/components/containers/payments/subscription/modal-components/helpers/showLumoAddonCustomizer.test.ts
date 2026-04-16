import { isBF2025Offer } from '@proton/payments/core/checkout';
import { canAddLumoAddon, hasVPN2024 } from '@proton/payments/core/subscription/helpers';
import {
    CYCLE,
    FREE_SUBSCRIPTION,
    type FreeSubscription,
    type PlanIDs,
    hasLumoAddonFromPlanIDs,
} from '@proton/payments/index';

import type { CouponConfigRendered } from '../../coupon-config/useCouponConfig';
import { showLumoAddonCustomizer } from './showLumoAddonCustomizer';

jest.mock('@proton/payments/core/checkout');
jest.mock('@proton/payments/core/subscription/helpers');
jest.mock('@proton/payments/index', () => ({
    ...jest.requireActual('@proton/payments/index'),
    hasLumoAddonFromPlanIDs: jest.fn(),
}));

const mockCanAddLumoAddon = canAddLumoAddon as jest.MockedFunction<typeof canAddLumoAddon>;
const mockHasVPN2024 = hasVPN2024 as jest.MockedFunction<typeof hasVPN2024>;
const mockHasLumoAddonFromPlanIDs = hasLumoAddonFromPlanIDs as jest.MockedFunction<typeof hasLumoAddonFromPlanIDs>;
const mockIsBF2025Offer = isBF2025Offer as jest.MockedFunction<typeof isBF2025Offer>;

const baseInput = {
    subscription: FREE_SUBSCRIPTION as FreeSubscription,
    couponConfig: undefined as CouponConfigRendered | undefined,
    initialCoupon: undefined as string | undefined | null,
    planIDs: {} as PlanIDs,
    cycle: CYCLE.YEARLY,
};

describe('showLumoAddonCustomizer', () => {
    beforeEach(() => {
        // Default: A=true, B=false, C=false, D=undefined, E=false → result=true
        mockCanAddLumoAddon.mockReturnValue(true);
        mockHasVPN2024.mockReturnValue(false);
        mockHasLumoAddonFromPlanIDs.mockReturnValue(false);
        mockIsBF2025Offer.mockReturnValue(false);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('canAddLumoAddon(subscription)', () => {
        it('returns false when canAddLumoAddon returns false', () => {
            mockCanAddLumoAddon.mockReturnValue(false);
            expect(showLumoAddonCustomizer(baseInput)).toBe(false);
        });

        it('returns true when canAddLumoAddon returns true and other conditions are met', () => {
            expect(showLumoAddonCustomizer(baseInput)).toBe(true);
        });
    });

    describe('!hasVPN2024(subscription) || hasLumoAddonFromPlanIDs(planIDs)', () => {
        it('returns false when hasVPN2024 is true and hasLumoAddonFromPlanIDs is false', () => {
            mockHasVPN2024.mockReturnValue(true);
            mockHasLumoAddonFromPlanIDs.mockReturnValue(false);
            expect(showLumoAddonCustomizer(baseInput)).toBe(false);
        });

        it('returns true when hasVPN2024 is true but hasLumoAddonFromPlanIDs is true', () => {
            mockHasVPN2024.mockReturnValue(true);
            mockHasLumoAddonFromPlanIDs.mockReturnValue(true);
            expect(showLumoAddonCustomizer(baseInput)).toBe(true);
        });

        it('returns true when hasVPN2024 is false and hasLumoAddonFromPlanIDs is false', () => {
            expect(showLumoAddonCustomizer(baseInput)).toBe(true);
        });

        it('returns true when hasVPN2024 is false and hasLumoAddonFromPlanIDs is true', () => {
            mockHasLumoAddonFromPlanIDs.mockReturnValue(true);
            expect(showLumoAddonCustomizer(baseInput)).toBe(true);
        });
    });

    describe('(!hideLumoAddonBanner && !isBF2025Offer) || hasLumoAddonFromPlanIDs', () => {
        describe('when hasLumoAddonFromPlanIDs is false', () => {
            it('returns true when couponConfig is undefined and isBF2025Offer is false', () => {
                expect(showLumoAddonCustomizer({ ...baseInput, couponConfig: undefined })).toBe(true);
            });

            it('returns true when hideLumoAddonBanner is false and isBF2025Offer is false', () => {
                expect(
                    showLumoAddonCustomizer({
                        ...baseInput,
                        couponConfig: { hideLumoAddonBanner: false } as CouponConfigRendered,
                    })
                ).toBe(true);
            });

            it('returns false when hideLumoAddonBanner is true', () => {
                expect(
                    showLumoAddonCustomizer({
                        ...baseInput,
                        couponConfig: { hideLumoAddonBanner: true } as CouponConfigRendered,
                    })
                ).toBe(false);
            });

            it('returns false when isBF2025Offer is true', () => {
                mockIsBF2025Offer.mockReturnValue(true);
                expect(showLumoAddonCustomizer(baseInput)).toBe(false);
            });

            it('returns false when both hideLumoAddonBanner is true and isBF2025Offer is true', () => {
                mockIsBF2025Offer.mockReturnValue(true);
                expect(
                    showLumoAddonCustomizer({
                        ...baseInput,
                        couponConfig: { hideLumoAddonBanner: true } as CouponConfigRendered,
                    })
                ).toBe(false);
            });
        });

        describe('when hasLumoAddonFromPlanIDs is true (Lumo addon already transferred to selected plan)', () => {
            beforeEach(() => {
                mockHasLumoAddonFromPlanIDs.mockReturnValue(true);
            });

            it('returns true even when hideLumoAddonBanner is true', () => {
                expect(
                    showLumoAddonCustomizer({
                        ...baseInput,
                        couponConfig: { hideLumoAddonBanner: true } as CouponConfigRendered,
                    })
                ).toBe(true);
            });

            it('returns true even when isBF2025Offer is true', () => {
                mockIsBF2025Offer.mockReturnValue(true);
                expect(showLumoAddonCustomizer(baseInput)).toBe(true);
            });

            it('returns true even when both hideLumoAddonBanner is true and isBF2025Offer is true', () => {
                mockIsBF2025Offer.mockReturnValue(true);
                expect(
                    showLumoAddonCustomizer({
                        ...baseInput,
                        couponConfig: { hideLumoAddonBanner: true } as CouponConfigRendered,
                    })
                ).toBe(true);
            });
        });
    });

    describe('short-circuit behaviour', () => {
        it('does not call hasVPN2024 when canAddLumoAddon returns false', () => {
            mockCanAddLumoAddon.mockReturnValue(false);
            showLumoAddonCustomizer(baseInput);
            expect(mockHasVPN2024).not.toHaveBeenCalled();
        });

        it('does not call isBF2025Offer when canAddLumoAddon returns false', () => {
            mockCanAddLumoAddon.mockReturnValue(false);
            showLumoAddonCustomizer(baseInput);
            expect(mockIsBF2025Offer).not.toHaveBeenCalled();
        });

        it('does not call isBF2025Offer when Clause 2 is false (hasVPN2024=true, hasLumoAddonFromPlanIDs=false)', () => {
            mockHasVPN2024.mockReturnValue(true);
            mockHasLumoAddonFromPlanIDs.mockReturnValue(false);
            showLumoAddonCustomizer(baseInput);
            expect(mockIsBF2025Offer).not.toHaveBeenCalled();
        });
    });

    describe('isBF2025Offer argument forwarding', () => {
        it('passes initialCoupon, planIDs, and cycle to isBF2025Offer', () => {
            const testCoupon = 'SOMECOUPON';
            const testPlanIDs = { mail2022: 1 } as unknown as PlanIDs;
            const testCycle = CYCLE.MONTHLY;

            showLumoAddonCustomizer({
                ...baseInput,
                initialCoupon: testCoupon,
                planIDs: testPlanIDs,
                cycle: testCycle,
            });

            expect(mockIsBF2025Offer).toHaveBeenCalledWith({
                coupon: testCoupon,
                planIDs: testPlanIDs,
                cycle: testCycle,
            });
        });

        it('forwards null initialCoupon to isBF2025Offer', () => {
            showLumoAddonCustomizer({ ...baseInput, initialCoupon: null });
            expect(mockIsBF2025Offer).toHaveBeenCalledWith(expect.objectContaining({ coupon: null }));
        });
    });
});
