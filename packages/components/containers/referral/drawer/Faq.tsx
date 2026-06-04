import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Href } from '@proton/atoms/Href/Href';
import Details from '@proton/components/components/container/Details';
import Summary from '@proton/components/components/container/Summary';
import { IcGift } from '@proton/icons/icons/IcGift';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import {
    getReferralMaxRewardCopy,
    getReferralStep1Copy,
    getReferralStep2Copy,
    getReferralStep3Copy,
} from '../referralCopy';

const FAQ = () => {
    const [referralInfo] = useReferralInfo();
    const { refereeRewardAmount, referrerRewardAmount, maxRewardAmount } = referralInfo.uiData;

    return (
        <Details className="my-2 border-none">
            <Summary className="text-rg text-bold relative interactive-pseudo pl-1 rounded-lg" useTriangle>
                {c('Title').t`How does it work?`}
            </Summary>

            <ul className="unstyled mt-2 m-0 text-sm color-weak flex flex-column gap-4">
                <li className="flex flex-nowrap gap-2">
                    <IcUsers className="shrink-0 color-hint" size={4} />
                    <p className="m-0">{getReferralStep1Copy()}</p>
                </li>
                <li className="flex flex-nowrap gap-2">
                    <IcGift className="shrink-0 color-hint" size={4} />
                    <p className="m-0">{getReferralStep2Copy(refereeRewardAmount)}</p>
                </li>
                <li className="flex flex-nowrap gap-2">
                    <IcMoneyBills className="shrink-0 color-hint" size={4} />
                    <div>
                        <p className="m-0">
                            {getReferralStep3Copy(referrerRewardAmount)} {getReferralMaxRewardCopy(maxRewardAmount)}
                        </p>
                    </div>
                </li>
            </ul>

            <div className="text-sm color-weak my-4">{c('Info')
                .t`You'll receive the credit reward 1 month after your friend subscribes to a yearly plan, and 2 months after they subscribe to a monthly plan.`}</div>
            <Href className="mt-4 text-sm" href={getStaticURL('/legal/terms-referral-program')}>{c('Link')
                .t`Terms and conditions`}</Href>
        </Details>
    );
};

export default FAQ;
