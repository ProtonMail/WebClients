import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import useApi from '@proton/components/hooks/useApi';
import { CYCLE, PLANS } from '@proton/payments';
import { PRODUCT_BIT } from '@proton/shared/lib/constants';
import { buildSubscription } from '@proton/testing/builders';

import { useCancellationStepEligibility } from './useCancellationStepEligibility';

jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/calendar/calendars/hooks', () => ({
    useGetCalendars: () => jest.fn(),
}));
jest.mock('@proton/account/plans/hooks', () => ({
    usePlans: () => [{ plans: [] }, false],
}));

const baseSubscription = buildSubscription(PLANS.VPN2024);
const baseUser = { ID: 'user-123', Subscribed: 0 };
const baseOrganization = { Name: 'test', UsedMembers: 1, Flags: 0, LoyaltyCounter: 0 };

describe('useCancellationStepEligibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useSubscription as jest.Mock).mockReturnValue([baseSubscription, false]);
        (useUser as jest.Mock).mockReturnValue([baseUser, false]);
        (useOrganization as jest.Mock).mockReturnValue([baseOrganization, false]);
        (useApi as jest.Mock).mockReturnValue(jest.fn());
    });
    describe('canShowDiscountWarning', () => {
        it('should return true when subscription has migration discount', async () => {
            (useSubscription as jest.Mock).mockReturnValue([
                { ...baseSubscription, CouponCode: 'MIGRATION_123' },
                false,
            ]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowDiscountWarning()).toBe(true);
        });

        it('should return false when subscription has no migration discount', async () => {
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowDiscountWarning()).toBe(false);
        });
    });

    describe('canShowDowngrade', () => {
        it('should return true when user has paid mail', async () => {
            (useUser as jest.Mock).mockReturnValue([{ ...baseUser, Subscribed: PRODUCT_BIT.MAIL }, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowDowngrade()).toBe(true);
        });

        it('should return true when user has paid vpn', async () => {
            (useUser as jest.Mock).mockReturnValue([{ ...baseUser, Subscribed: PRODUCT_BIT.VPN }, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowDowngrade()).toBe(true);
        });

        it('should return false when user has no paid services', async () => {
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowDowngrade()).toBe(false);
        });
    });

    describe('canShowInAppPurchase', () => {
        it('should return false when subscription can be cancelled', async () => {
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowInAppPurchase()).toBe(false);
        });

        it('should return false when subscription is undefined', async () => {
            (useSubscription as jest.Mock).mockReturnValue([undefined, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowInAppPurchase()).toBe(false);
        });

        it('should return true when subscription is managed externally', async () => {
            (useSubscription as jest.Mock).mockReturnValue([{ ...baseSubscription, External: 2 }, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowInAppPurchase()).toBe(true);
        });
    });

    describe('canShowLossLoyalty', () => {
        it('should return true when organization has loyalty counter', async () => {
            (useOrganization as jest.Mock).mockReturnValue([{ ...baseOrganization, LoyaltyCounter: 5 }, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowLossLoyalty()).toBe(true);
        });

        it('should return true when organization has flags', async () => {
            (useOrganization as jest.Mock).mockReturnValue([{ ...baseOrganization, Flags: 1 }, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowLossLoyalty()).toBe(true);
        });

        it('should return false when organization has no bonuses', async () => {
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowLossLoyalty()).toBe(false);
        });
    });

    describe('canShowMemberDowngrade', () => {
        it('should return true when organization has more than 1 member', async () => {
            (useOrganization as jest.Mock).mockReturnValue([{ ...baseOrganization, UsedMembers: 3 }, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowMemberDowngrade()).toBe(true);
        });

        it('should return false when organization has 1 member', async () => {
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowMemberDowngrade()).toBe(false);
        });
    });

    describe('canShowPassLaunchOffer', () => {
        it('should return true when subscription has pass launch offer', async () => {
            const subscription = {
                ...baseSubscription,
                Cycle: CYCLE.YEARLY,
                Plans: [{ ...baseSubscription.Plans[0], Name: PLANS.PASS, Offer: 'passlaunch' }],
            };
            (useSubscription as jest.Mock).mockReturnValue([subscription, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowPassLaunchOffer()).toBe(true);
        });

        it('should return false when subscription has no pass launch offer', async () => {
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowPassLaunchOffer()).toBe(false);
        });
    });
});
