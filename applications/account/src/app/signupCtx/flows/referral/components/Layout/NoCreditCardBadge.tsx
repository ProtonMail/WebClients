import { c } from 'ttag';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { IcCreditCardSlashed } from '@proton/icons/icons/IcCreditCardSlashed';
import type { PLANS } from '@proton/payments';

export const NoCreditCardBadge = ({ plan }: { plan: PLANS }) => {
    const { eligibleTrials } = useEligibleTrials();

    if (eligibleTrials.creditCardRequiredPlans.includes(plan)) {
        return null;
    }

    return (
        <span
            className="referral-no-credit-card-badge m-0 color-success text-semibold pl-1 pr-2 py-0 inline-flex gap-2 items-center"
            style={{ backgroundColor: 'rgb(229 249 237)' }}
        >
            <IcCreditCardSlashed className="shrink-0" />
            {
                // translator: Shortest version of "No credit card required", best under 20 characters
                c('Info').t`No card required`
            }
        </span>
    );
};
