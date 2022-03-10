import { c, msgid } from 'ttag';
import { Referral, ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
    hasReachedRewardLimit: boolean;
}

const RewardCell = ({ referral, hasReachedRewardLimit }: Props) => {
    let reward: string | React.ReactNode = '-';

    const monthsRewarded = referral.RewardMonths || 0;

    switch (referral.State) {
        case ReferralState.SIGNED_UP:
        case ReferralState.TRIAL:
            if (!hasReachedRewardLimit) {
                reward = c('Label').t`Waiting for subscription`;
            }
            break;
        case ReferralState.COMPLETED:
            if (!hasReachedRewardLimit) {
                /*
                 * translator : We are in a table cell.
                 * A user referee have signed up or completed a subscription
                 * We show the reward user would be allowed to get.
                 */
                reward = c('Label').t`Credits pending`;
            }
            break;
        case ReferralState.REWARDED:
            /*
             * translator : We are in a table cell.
             * A user referee have signed up or completed a subscription
             * We show the reward user has been credited.
             * Example : "3 months credited"
             */
            reward = c('Label').ngettext(
                msgid`${monthsRewarded} month credited`,
                `${monthsRewarded} months credited`,
                monthsRewarded
            );
            break;
    }

    return <>{reward}</>;
};

export default RewardCell;
