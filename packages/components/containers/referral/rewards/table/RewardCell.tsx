import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ThemeColorUnion } from '@proton/colors';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import { CYCLE } from '@proton/payments/core/constants';
import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
    hasReachedRewardLimit: boolean;
    hasCompletedReferral: boolean;
}

const RewardCell = ({ referral, hasReachedRewardLimit, hasCompletedReferral }: Props) => {
    let reward: string | React.ReactNode = '-';
    let textColor: ThemeColorUnion | undefined;
    let tooltip: string = '';

    switch (referral.State) {
        case ReferralState.SIGNED_UP:
        case ReferralState.TRIAL:
            if (!hasReachedRewardLimit) {
                reward = c('Label').t`Pending`;
                textColor = 'weak';
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
                textColor = 'weak';
                if (hasCompletedReferral) {
                    if (referral.ReferredUserSubscriptionCycle === CYCLE.MONTHLY) {
                        tooltip = c('Info')
                            .t`You'll receive the credit reward 2 months after your friend's trial ended.`;
                    } else if (referral.ReferredUserSubscriptionCycle === CYCLE.YEARLY) {
                        tooltip = c('Info')
                            .t`You'll receive the credit reward 1 month after your friend's trial ended.`;
                    } else {
                        tooltip = c('Info')
                            .t`You'll receive the credit reward 1 month after your friend subscribes to a yearly plan, and 2 months after they subscribe to a monthly plan.`;
                    }
                }
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

    return (
        <div className={textColor ? `color-${textColor}` : undefined}>
            {reward}
            {tooltip && (
                <Tooltip title={tooltip}>
                    <span>
                        <IcInfoCircle className="ml-2 color-primary" size={4} />
                    </span>
                </Tooltip>
            )}
        </div>
    );
};

export default RewardCell;
