import { c } from 'ttag';

import type { ThemeColorUnion } from '@proton/colors';
import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
    hasReachedRewardLimit: boolean;
}

const RewardCell = ({ referral, hasReachedRewardLimit }: Props) => {
    let reward: string | React.ReactNode = '-';
    let textColor: ThemeColorUnion | undefined;

    switch (referral.State) {
        case ReferralState.SIGNED_UP:
        case ReferralState.TRIAL:
            if (!hasReachedRewardLimit) {
                reward = c('Label').t`Pending`;
                textColor = 'warning';
            }
            break;
        case ReferralState.COMPLETED:
            if (!hasReachedRewardLimit) {
                /*
                 * translator : We are in a table cell.
                 * A user referee have signed up or completed a subscription.
                 * "Credits pending" means a variable number of reward. Can be 0, 1 or 3.
                 * And at this stage we have no variables allowing us to know the amount.
                 */
                reward = c('Label').t`Pending`;
                textColor = 'warning';
            }
            break;
        case ReferralState.REWARDED:
            /*
             * translator : We are in a table cell.
             * A user referee have signed up or completed a subscription
             * We show the reward user has been credited.
             * Example : "3 months credited"
             */
            reward = c('Label').t`Awarded`;
            textColor = 'success';
            break;
    }

    return <div className={textColor ? `color-${textColor}` : undefined}>{reward}</div>;
};

export default RewardCell;
