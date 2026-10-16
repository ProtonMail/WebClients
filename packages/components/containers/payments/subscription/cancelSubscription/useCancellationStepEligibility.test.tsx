import { useSubscription } from '@proton/account/subscription/hooks';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { componentsHookRenderer } from '../../../contacts/tests/render';
import { useCancellationStepEligibility } from './useCancellationStepEligibility';

jest.mock('@proton/account/subscription/hooks');

const baseSubscription = buildSubscription(PLANS.VPN2024);

describe('useCancellationStepEligibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useSubscription as jest.Mock).mockReturnValue([baseSubscription, false]);
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

        it('should return false when subscription is undefined', async () => {
            (useSubscription as jest.Mock).mockReturnValue([undefined, false]);
            const { result } = componentsHookRenderer(useCancellationStepEligibility);

            expect(await result.current.canShowPassLaunchOffer()).toBe(false);
        });
    });
});
