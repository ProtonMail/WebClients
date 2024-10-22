import { componentsHookRenderer } from '@proton/components/containers/contacts/tests/render';
import { useSubscription } from '@proton/components/hooks';
import { PLANS, PLAN_TYPES } from '@proton/payments';
import useFlag from '@proton/unleash/useFlag';

import useCancellationFlow from './useCancellationFlow';

jest.mock('@proton/components/hooks/useSubscription');
const mockUseSubscription = useSubscription as jest.MockedFunction<any>;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.MockedFunction<any>;

const b2bSubscription = {
    Plans: [
        {
            Type: PLAN_TYPES.PLAN,
            Name: PLANS.BUNDLE_PRO_2024,
        },
    ],
};

const b2cSubscription = {
    Plans: [
        {
            Type: PLAN_TYPES.PLAN,
            Name: PLANS.MAIL,
        },
    ],
};

const unsupportedSubscription = {
    Plans: [
        {
            Type: PLAN_TYPES.PLAN,
            Name: PLANS.PASS_BUSINESS,
        },
    ],
};

describe('useCancellationFlow', () => {
    beforeEach(() => {
        // We want to enable the feature everywhere
        mockUseFlag.mockReturnValue(true);
    });

    it.each([
        [b2bSubscription, { b2cAccess: false, b2bAccess: true }],
        [b2cSubscription, { b2cAccess: true, b2bAccess: false }],
        [unsupportedSubscription, { b2cAccess: false, b2bAccess: false }],
    ])(`Should return b2bAccess for b2b users and b2cAccess for b2c users`, (subscription, expected) => {
        mockUseSubscription.mockReturnValue([subscription, false]);

        const { result } = componentsHookRenderer(() => useCancellationFlow());
        expect(result.current.b2bAccess).toBe(expected.b2bAccess);
        expect(result.current.b2cAccess).toBe(expected.b2cAccess);
    });

    it('Should return false for b2b and b2c access if new flow is disabled', () => {
        mockUseFlag.mockReturnValue(false);

        const { result } = componentsHookRenderer(() => useCancellationFlow());
        expect(result.current.b2bAccess).toBe(false);
        expect(result.current.b2cAccess).toBe(false);
    });
});
