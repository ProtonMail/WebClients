import { useStaticExperiment } from '@proton/account/staticExperiments/useStaticExperiment';
import { PLANS } from '@proton/payments/core/constants';

import type { VPNSignupMode } from './interface';

const eligiblePreSelectedPlans: (string | undefined)[] = [undefined, PLANS.VPN2024, PLANS.BUNDLE];

/**
 * Value of the `v` query parameter of the links to the three plans page: `?v=b`.
 * Growth splits the traffic by link with its own A/B tool, so the page is only shown on these links.
 * `v` is shared with the older VPN 2024 signup experiment (`useVpn2024SignupExperiment`), which only acts
 * on `no-addon` and `pass-addon-only`.
 */
const THREE_PLANS_URL_VALUE = 'b';

type VpnSignupThreePlansVariant = Exclude<ReturnType<typeof useStaticExperiment<'VpnSignupThreePlans'>>, 'disabled'>;

interface Options {
    mode: VPNSignupMode;
    isB2bPlan: boolean;
    coupon: string | undefined;
    trial: boolean | undefined;
    preSelectedPlan: string | undefined;
    /** Value of the `v` query parameter, `signupParameters.vpn2024SignupExperimentVariant` */
    urlVariant: string | undefined;
}

/**
 * Three plans page of the VPN signup: Free, VPN Plus and Proton Unlimited cards in the plan selection.
 * It's shown only when the VpnSignupThreePlans static experiment is on (Treatment) and the link has `?v=b`.
 * Only the default B2C pricing page takes part. B2B, trials, coupons, promotions and links that
 * preselect another plan keep the regular page.
 *
 * The static experiment is resolved when the public app starts, so it's already known on the first render.
 * `variant` is only set for users who take part, to tag their telemetry: `Treatment` for those who see
 * the three plans, `Control` for the others.
 */
export const useVpnSignupThreePlans = ({ mode, isB2bPlan, coupon, trial, preSelectedPlan, urlVariant }: Options) => {
    const experimentVariant = useStaticExperiment('VpnSignupThreePlans');

    const isEligible =
        mode === 'pricing' && !isB2bPlan && !coupon && !trial && eligiblePreSelectedPlans.includes(preSelectedPlan);

    const showThreePlans = isEligible && experimentVariant === 'Treatment' && urlVariant === THREE_PLANS_URL_VALUE;

    const variant: VpnSignupThreePlansVariant | undefined = (() => {
        if (!isEligible || experimentVariant === 'disabled') {
            return;
        }
        return showThreePlans ? 'Treatment' : 'Control';
    })();

    return {
        variant,
        showThreePlans,
    };
};
