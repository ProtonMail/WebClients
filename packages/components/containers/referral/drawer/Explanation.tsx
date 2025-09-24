import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { BRAND_NAME, REFERRAL_EXPANSION_PROGRAM_MAX_AMOUNT } from '@proton/shared/lib/constants';

const Explanation = () => {
    const maxCredits = getSimplePriceString('USD', REFERRAL_EXPANSION_PROGRAM_MAX_AMOUNT);
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    return (
        <p className="m-0 color-weak text-sm">
            {c('Referral')
                .t`Earn up to ${maxCredits} in credit. You’ll get ${referrerRewardAmount} when the person you invite subscribes to a ${BRAND_NAME} plan.`}
        </p>
    );
};

export default Explanation;
