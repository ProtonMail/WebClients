import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import {
    getReferralMaxRewardCopy,
    getReferralStep1Copy,
    getReferralStep2Copy,
    getReferralStep3Copy,
} from '../../referralCopy';
import step1 from './step1.svg';
import step2 from './step2.svg';
import step3 from './step3.svg';

interface Props extends Pick<ComponentPropsWithoutRef<'div'>, 'className' | 'style'> {}

const HowItWorks = ({ className, style }: Props) => {
    const [referralInfo] = useReferralInfo();
    const { refereeRewardAmount, referrerRewardAmount, maxRewardAmount } = referralInfo.uiData;

    return (
        <div className={clsx(className, 'lg:max-w-custom w-full')} style={{ '--lg-max-w-custom': '19rem', ...style }}>
            <div className="flex flex-column gap-4">
                <h1 className="m-0 text-semibold text-lg">{c('Referral')
                    .t`Give ${refereeRewardAmount}, get ${referrerRewardAmount}`}</h1>

                <ol className="unstyled flex flex-column gap-6 m-0">
                    <li className="flex flex-nowrap items-center gap-4">
                        <img
                            src={step1}
                            alt=""
                            className="w-custom shrink-0 ratio-square"
                            style={{ '--w-custom': '3rem' }}
                        />
                        <div>{getReferralStep1Copy()}</div>
                    </li>
                    <li className="flex flex-nowrap items-center gap-4">
                        <img
                            src={step2}
                            alt=""
                            className="w-custom shrink-0 ratio-square"
                            style={{ '--w-custom': '3rem' }}
                        />
                        <div>{getReferralStep2Copy(refereeRewardAmount)}</div>
                    </li>
                    <li className="flex flex-nowrap items-center gap-4">
                        <img
                            src={step3}
                            alt=""
                            className="w-custom shrink-0 ratio-square"
                            style={{ '--w-custom': '3rem' }}
                        />
                        <div>{getReferralStep3Copy(referrerRewardAmount)}</div>
                    </li>
                </ol>

                <p className="m-0">{getReferralMaxRewardCopy(maxRewardAmount)}</p>

                <p className="m-0">
                    <Href className="inline-block" href={getKnowledgeBaseUrl('/referral-program')}>
                        {c('Link').t`Learn more`}
                    </Href>
                </p>
            </div>
        </div>
    );
};

export default HowItWorks;
