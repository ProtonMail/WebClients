import { c } from 'ttag';
import { Referral, ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
}

const ActivityCell = ({ referral }: Props) => {
    let message: React.ReactNode = null;

    switch (referral.State) {
        case ReferralState.INVITED:
            message = referral.Email
                ? // translator : We are in a table cell. A user referee has been invited via mail
                  c('Info').t`Invited via email`
                : // translator : We are in a table cell. A user referee has signed up via his referral link
                  c('Info').t`Signed up via your link`;
            break;
        case ReferralState.SIGNED_UP:
        case ReferralState.TRIAL:
            // translator : We are in a table cell. A user referee has signed up
            message = c('Info').t`Signed up`;
            break;
        case ReferralState.COMPLETED:
        case ReferralState.REWARDED:
            const monthsSubscribed = referral.ReferredUserSubscriptionCycle || 0;
            message =
                monthsSubscribed === 1
                    ? // translator : We are in a table cell. We inform user that a referred user has paid for a monthly plan
                      c('Info').t`Paid for a monthly plan`
                    : // translator : We are in a table cell. We inform user that a referred user has paid for 12months plan
                      c('Info').t`Paid for a ${monthsSubscribed} months plan`;
            break;
    }

    return <>{message}</>;
};

export default ActivityCell;
