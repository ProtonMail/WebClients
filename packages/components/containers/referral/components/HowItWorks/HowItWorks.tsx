import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import step1 from './step1.svg';
import step2 from './step2.svg';
import step3 from './step3.svg';

interface Props extends Pick<ComponentPropsWithoutRef<'div'>, 'className' | 'style'> { }

const HowItWorks = ({ className, style }: Props) => {
    const [referralInfo] = useReferralInfo();
    const { refereeRewardAmount, referrerRewardAmount } = referralInfo.uiData;

    return (
        <div className={clsx(className, 'lg:max-w-custom w-full')} style={{ '--lg-max-w-custom': '19rem', ...style }}>
            <div className="flex flex-column gap-4">
                <h1 className="m-0 text-semibold text-lg">{c('Referral').t`Give 2 weeks, get ${referrerRewardAmount}`}</h1>

                <ol className="unstyled flex flex-column gap-6 m-0">
                    <li className="flex flex-nowrap items-center gap-4">
                        <img
                            src={step1}
                            alt=""
                            className="w-custom shrink-0 ratio-square"
                            style={{ '--w-custom': '3rem' }}
                        />
                        <div>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`**Step 1: Invite your friends** to ${BRAND_NAME} with your referral link.`
                            )}
                        </div>
                    </li>
                    <li className="flex flex-nowrap items-center gap-4">
                        <img
                            src={step2}
                            alt=""
                            className="w-custom shrink-0 ratio-square"
                            style={{ '--w-custom': '3rem' }}
                        />
                        <div>
                            {getBoldFormattedText(
                                c('Info').t`**Step 2:** Your friends get **2 weeks for free** on their plan.`
                            )}
                        </div>
                    </li>
                    <li className="flex flex-nowrap items-center gap-4">
                        <img
                            src={step3}
                            alt=""
                            className="w-custom shrink-0 ratio-square"
                            style={{ '--w-custom': '3rem' }}
                        />
                        <div>
                            {getBoldFormattedText(
                                c('Info')
                                    .t`**Step 3:** Get **${referrerRewardAmount} in credits** for every person that subscribes to a plan.`
                            )}
                        </div>
                    </li>
                </ol>

                <p className="m-0">
                    {getBoldFormattedText(c('Referral').t`Your friend will also get ${refereeRewardAmount} to redeem on their next bill!`)}{' '}
                    <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Learn more`}</Href>
                </p>
            </div>
        </div>
    );
};

export default HowItWorks;
