import { c, msgid } from 'ttag';
import { Referral, ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
}

const RewardCell = ({ referral }: Props) => {
    let reward: string | React.ReactNode = '-';

    const monthsRewarded = referral.RewardMonths || 0;

    switch (referral.State) {
        case ReferralState.COMPLETED:
            // translator : complete sentense example : "3 months pending"
            reward = c('Label').ngettext(
                msgid`${monthsRewarded} month pending`,
                `${monthsRewarded} months pending`,
                monthsRewarded
            );
            break;
        case ReferralState.REWARDED:
            // translator : complete sentense example : "3 months credited"
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
