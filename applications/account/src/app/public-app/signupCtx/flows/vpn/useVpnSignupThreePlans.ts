import { useStaticExperiment } from '@proton/account/staticExperiments/useStaticExperiment';
import { PLANS } from '@proton/payments/core/constants';

import type { VPNSignupMode } from './interface';

const eligiblePreSelectedPlans: (string | undefined)[] = [undefined, PLANS.VPN2024, PLANS.BUNDLE];

type VpnSignupThreePlansVariant = Exclude<ReturnType<typeof useStaticExperiment<'VpnSignupThreePlans'>>, 'disabled'>;

interface Options {
    mode: VPNSignupMode;
    isB2bPlan: boolean;
    coupon: string | undefined;
    trial: boolean | undefined;
    preSelectedPlan: string | undefined;
}

/**
 * VpnSignupThreePlans static experiment: the plan selection shows Free, VPN Plus and Proton Unlimited cards.
 * Only the default B2C pricing page takes part. B2B, trials, coupons, promotions and links that
 * preselect another plan keep the regular page.
 *
 * The variant is resolved when the public app starts, so it's already known on the first render.
 * `variant` is only set for users who take part, to tag their telemetry.
 */
export const useVpnSignupThreePlans = ({ mode, isB2bPlan, coupon, trial, preSelectedPlan }: Options) => {
    const experimentVariant = useStaticExperiment('VpnSignupThreePlans');

    const isEligible =
        mode === 'pricing' && !isB2bPlan && !coupon && !trial && eligiblePreSelectedPlans.includes(preSelectedPlan);

    const variant: VpnSignupThreePlansVariant | undefined =
        isEligible && experimentVariant !== 'disabled' ? experimentVariant : undefined;

    return {
        variant,
        showThreePlans: variant === 'Treatment',
    };
};
