import { useSubscription } from '@proton/account/subscription/hooks';
import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import { PLANS, PLAN_TYPES } from '@proton/payments';
import { useFlag } from '@proton/unleash/useFlag';

import { useFeedbackFirstEligibility } from './useFeedbackFirstEligibility';

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = useSubscription as jest.MockedFunction<any>;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

const buildSubscriptionMock = (planName: PLANS) => ({
    Plans: [{ Type: PLAN_TYPES.PLAN, Name: planName }],
});

describe('useFeedbackFirstEligibility', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(true);
    });

    describe('B2C plans', () => {
        it.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.DRIVE, PLANS.DRIVE_1TB])(
            'should grant B2C access for %s',
            (plan) => {
                mockUseSubscription.mockReturnValue([buildSubscriptionMock(plan), false]);

                const { result } = componentsHookRenderer(() => useFeedbackFirstEligibility());
                expect(result.current.hasB2CAccess).toBe(true);
                expect(result.current.hasB2BAccess).toBe(false);
            }
        );
    });

    describe('B2B plans', () => {
        it.each([
            PLANS.MAIL_PRO,
            PLANS.MAIL_BUSINESS,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.BUNDLE_BIZ_2025,
            PLANS.DRIVE_BUSINESS,
            PLANS.DRIVE_PRO,
        ])('should grant B2B access for %s', (plan) => {
            mockUseSubscription.mockReturnValue([buildSubscriptionMock(plan), false]);

            const { result } = componentsHookRenderer(() => useFeedbackFirstEligibility());
            expect(result.current.hasB2CAccess).toBe(false);
            expect(result.current.hasB2BAccess).toBe(true);
        });
    });

    it('should return false for both when flag is disabled', () => {
        mockUseFlag.mockReturnValue(false);
        mockUseSubscription.mockReturnValue([buildSubscriptionMock(PLANS.MAIL), false]);

        const { result } = componentsHookRenderer(() => useFeedbackFirstEligibility());
        expect(result.current.hasB2CAccess).toBe(false);
        expect(result.current.hasB2BAccess).toBe(false);
    });
});
