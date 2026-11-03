import { useSubscription } from '@proton/account/subscription/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { componentsHookRenderer } from '../../../../contacts/tests/render';
import { useFeedbackFirstEligibility } from './useFeedbackFirstEligibility';

jest.mock('@proton/account/subscription/hooks');

describe('useFeedbackFirstEligibility', () => {
    describe('B2C plans', () => {
        it.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.DRIVE, PLANS.DRIVE_1TB])(
            'should grant B2C access for %s',
            (plan) => {
                const { result } = componentsHookRenderer(() => useFeedbackFirstEligibility(buildSubscription(plan)));
                expect(result.current.hasB2CAccess).toBe(true);
                expect(result.current.hasB2BAccess).toBe(false);
            }
        );
    });

    describe('B2B plans', () => {
        it.each([PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025])(
            'should grant B2B access for %s',
            (plan) => {
                const { result } = componentsHookRenderer(() => useFeedbackFirstEligibility(buildSubscription(plan)));
                expect(result.current.hasB2CAccess).toBe(false);
                expect(result.current.hasB2BAccess).toBe(true);
            }
        );
    });

    it('should check the given subscription, not the one from useSubscription', () => {
        jest.mocked(useSubscription).mockReturnValue([buildSubscription(PLANS.MAIL), false]);

        const { result } = componentsHookRenderer(() => useFeedbackFirstEligibility(buildSubscription(PLANS.LUMO)));

        expect(result.current.hasB2CAccess).toBe(false);
        expect(result.current.hasB2BAccess).toBe(false);
    });
});
