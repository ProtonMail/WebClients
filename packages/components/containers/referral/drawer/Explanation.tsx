import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const Explanation = () => {
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount, maxRewardAmount } = referralInfo.uiData;

    return (
        <p className="m-0 color-weak text-sm">
            {c('Referral')
                .t`Earn up to ${maxRewardAmount} in credit. You’ll get ${referrerRewardAmount} when the person you invite subscribes to a ${BRAND_NAME} plan.`}
        </p>
    );
};

export default Explanation;
