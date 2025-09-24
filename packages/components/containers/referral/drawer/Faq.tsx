import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import Details from '@proton/components/components/container/Details';
import Summary from '@proton/components/components/container/Summary';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcGift, IcMoneyBills, IcUsers } from '@proton/icons';
import { BRAND_NAME } from '@proton/shared/lib/constants';

const FAQ = () => {
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    return (
        <Details className="mb-2 border-none">
            <Summary className="text-rg text-bold relative interactive-pseudo pl-1 rounded-lg" useTriangle>
                {c('Title').t`How does it work?`}
            </Summary>

            <ul className="unstyled m-0 text-sm color-weak flex flex-column gap-4">
                <li className="flex flex-nowrap gap-3">
                    <IcUsers className="shrink-0 color-hint" size={5} />
                    <p className="m-0">
                        {getBoldFormattedText(
                            c('Info').t`**Step 1:** Invite your friends to ${BRAND_NAME} with your referral link.`
                        )}
                    </p>
                </li>
                <li className="flex flex-nowrap gap-3">
                    <IcGift className="shrink-0 color-hint" size={5} />
                    <p className="m-0">
                        {getBoldFormattedText(
                            c('Info')
                                .t`**Step 2:** Your friends get 2 weeks for free on their chosen ${BRAND_NAME} plan.`
                        )}
                    </p>
                </li>
                <li className="flex flex-nowrap gap-3">
                    <IcMoneyBills className="shrink-0 color-hint" size={5} />
                    <p className="m-0">
                        {getBoldFormattedText(
                            c('Info')
                                .t`**Step 3:** Get ${referrerRewardAmount} credits for every friend that subscribes to a plan.`
                        )}
                    </p>
                </li>
            </ul>
        </Details>
    );
};

export default FAQ;
