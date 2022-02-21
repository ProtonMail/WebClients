import { c } from 'ttag';
import { Referral, ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
}

const ActivityCell = ({ referral }: Props) => {
    let message: React.ReactNode = null;

    switch (referral.State) {
        case ReferralState.INVITED:
            message = referral.Email ? c('Info').t`Invited via email` : c('Info').t`Signed up via your link`;
            break;
        case ReferralState.SIGNED_UP:
        case ReferralState.TRIAL:
            message = c('Info').t`Signed up`;
            break;
        case ReferralState.COMPLETED:
        case ReferralState.REWARDED:
            message =
                (referral.RewardMonths || 0) > 1
                    ? c('Info').t`Paid for a month plan`
                    : c('Info').t`Paid for a 12 months plan`;
            break;
    }

    return <>{message}</>;
};

export default ActivityCell;
