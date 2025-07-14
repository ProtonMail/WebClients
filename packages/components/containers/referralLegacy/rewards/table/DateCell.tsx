import { format, fromUnixTime } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';
import type { Referral } from '@proton/shared/lib/interfaces';
import { ReferralState } from '@proton/shared/lib/interfaces';

interface Props {
    referral: Referral;
}

const DateCell = ({ referral }: Props) => {
    let nextDate = null;

    switch (referral.State) {
        case ReferralState.INVITED:
            nextDate = referral.CreateTime;
            break;
        case ReferralState.SIGNED_UP:
            nextDate = referral.SignupTime;
            break;
        case ReferralState.TRIAL:
            nextDate = referral.TrialTime;
            break;
        case ReferralState.COMPLETED:
            nextDate = referral.CompleteTime;
            break;
        case ReferralState.REWARDED:
            nextDate = referral.RewardTime;
            break;
    }

    return <>{nextDate ? format(fromUnixTime(referral.CreateTime), 'P', { locale: dateLocale }) : null}</>;
};

export default DateCell;
