import { c, msgid } from 'ttag';

import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
}

const ActivityCell = ({ referral }: Props) => {
    let message: React.ReactNode = null;

    switch (referral.State) {
        case ReferralState.INVITED:
            message = referral.Email
                ? // translator : We're in a table cell displaying an activity status.
                  // Value can be `Invited via email` or `Signed up via your link` or `Signed up`
                  // Here the user referee has been invited via mail
                  c('User referee invited via email').t`Invited via email`
                : // translator : We're in a table cell displaying an activity status.
                  // Value can be `Invited via email` or `Signed up via your link` or `Signed up`
                  // Here the user referee signed up using his referral link
                  c('User referee signed up using referral link').t`Signed up via your link`;
            break;
        case ReferralState.SIGNED_UP:
        case ReferralState.TRIAL:
            // translator : We are in a table cell. A user referee has signed up
            message = c('Info').t`Signed up`;
            break;
        case ReferralState.COMPLETED:
        case ReferralState.REWARDED:
            const rewardMonths = referral.ReferredUserSubscriptionCycle || 0;

            if (rewardMonths === 1) {
                message = c('Info').t`Paid for a monthly plan`;
            }

            // translator : We are in a table cell. We inform user that a referred user has paid for a plan
            message = c('Info').ngettext(
                msgid`Paid for a ${rewardMonths} month plan`,
                `Paid for a ${rewardMonths} months plan`,
                rewardMonths
            );
            break;
    }

    return <>{message}</>;
};

export default ActivityCell;
