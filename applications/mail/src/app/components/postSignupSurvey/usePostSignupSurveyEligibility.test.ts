import { renderHook } from '@testing-library/react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { PLANS } from '@proton/payments/core/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { usePostSignupSurveyEligibility } from './usePostSignupSurveyEligibility';

jest.mock('@proton/account/organization/hooks');
jest.mock('@proton/account/welcomeFlags');
jest.mock('@proton/unleash/useFlag');

const mockUseOrganization = jest.mocked(useOrganization);
const mockUseWelcomeFlags = jest.mocked(useWelcomeFlags);
const mockUseFlag = jest.mocked(useFlag);

const setup = ({
    enabled = true,
    isReplay = false,
    planName,
    loading = false,
}: {
    enabled?: boolean;
    isReplay?: boolean;
    planName?: PLANS;
    loading?: boolean;
} = {}) => {
    mockUseFlag.mockReturnValue(enabled);
    mockUseWelcomeFlags.mockReturnValue({ welcomeFlags: { isReplay } } as any);
    mockUseOrganization.mockReturnValue([planName ? { PlanName: planName } : undefined, loading] as any);

    return renderHook(() => usePostSignupSurveyEligibility()).result.current;
};

describe('usePostSignupSurveyEligibility', () => {
    it('is eligible for a B2C user without organization', () => {
        expect(setup()).toBe(true);
    });

    it('is eligible for a B2C organization such as Family', () => {
        expect(setup({ planName: PLANS.FAMILY })).toBe(true);
    });

    it('is not eligible when the feature flag is off', () => {
        expect(setup({ enabled: false })).toBe(false);
    });

    it('is not eligible on an onboarding replay', () => {
        expect(setup({ isReplay: true })).toBe(false);
    });

    it('is not eligible while the organization is loading', () => {
        expect(setup({ loading: true })).toBe(false);
    });

    it.each([PLANS.BUNDLE_PRO, PLANS.MAIL_PRO, PLANS.MAIL_BUSINESS])(
        'is not eligible for the B2B plan %s',
        (planName) => {
            expect(setup({ planName })).toBe(false);
        }
    );
});
