import { type ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Href, VerticalStep, VerticalSteps } from '@proton/atoms';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import { referralReward } from '../../constants';
import bannerReferralIntro from './banner-referral-intro.svg';

interface Props extends Pick<ComponentPropsWithoutRef<'div'>, 'className' | 'style'> {}

const HowItWorks = ({ className, style }: Props) => {
    return (
        <div className={clsx(className, 'max-w-custom ')} style={{ '--max-w-custom': '19rem', ...style }}>
            <h3 className="h4 text-bold mb-4 text-center">{
                // translator: Full sentence 'Give US$20 and 2 weeks for free. Get US$20 credits.'
                c('Title').t`Give ${referralReward} and 2 weeks for free. Get ${referralReward} credits.`
            }</h3>

            <div className="flex justify-center">
                <img src={bannerReferralIntro} alt="Referral intro" />
            </div>

            <VerticalSteps className="vertical-steps--primary m-0">
                <VerticalStep titleCentered titleBold={false} icon={<span className="m-auto">1</span>}>
                    <div>
                        {getBoldFormattedText(
                            c('Info').t`**Invite your friends** to ${BRAND_NAME} with your referral link.`
                        )}
                    </div>
                </VerticalStep>
                <VerticalStep titleCentered titleBold={false} icon={<span className="m-auto">2</span>}>
                    <div>
                        {getBoldFormattedText(c('Info').t`Your friends get **2 weeks for free** on their chosen plan.`)}
                    </div>
                </VerticalStep>
                <VerticalStep titleCentered titleBold={false} icon={<span className="m-auto">2</span>}>
                    <div>
                        {getBoldFormattedText(
                            // translator: Full sentence `Get and give US$20 credits for every friend that subscribes.`
                            c('Info').t`Get and give **${referralReward} credits** for every friend that subscribes.`
                        )}
                    </div>
                </VerticalStep>
            </VerticalSteps>

            <div className="flex justify-center">
                <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Terms and conditions`}</Href>
            </div>
        </div>
    );
};

export default HowItWorks;
