import type { Breakpoints } from '@proton/components/hooks/useActiveBreakpoint';
import { PLANS } from '@proton/payments/core/constants';
import { useVariant } from '@proton/unleash/useVariant';

interface Options {
    viewportWidth: Breakpoints['viewportWidth'];
    isB2bPlan: boolean;
    signupTrial: boolean;
    checkTrial: boolean;
    planName: string;
}

/**
 * Whether the signup shows the mobile checkout (VpnSignupMobileCheckout experiment).
 * Phones only: B2B, trials and free signups keep the regular checkout.
 */
export const useIsMobileCheckout = ({ viewportWidth, isB2bPlan, signupTrial, checkTrial, planName }: Options) => {
    const variant = useVariant('VpnSignupMobileCheckout');

    return (
        variant.name === 'Treatment' &&
        variant.enabled &&
        viewportWidth.xsmall &&
        !isB2bPlan &&
        !signupTrial &&
        !checkTrial &&
        planName !== PLANS.FREE
    );
};
