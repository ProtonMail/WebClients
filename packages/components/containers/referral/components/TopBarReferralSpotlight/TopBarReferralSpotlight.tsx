import type { ReactElement } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Button, ButtonLike, Href } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useConfig from '@proton/components/hooks/useConfig';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import step1 from './step1.svg';
import step2 from './step2.svg';
import step3 from './step3.svg';

interface Props {
    children?: ReactElement;
    show: boolean;
    onClose: () => void;
    onDismiss: () => void;
}

export const TopBarReferralSpotlight = ({ children, show, onClose, onDismiss }: Props) => {
    const { APP_NAME: currentApp } = useConfig();
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount, maxRewardAmount } = referralInfo.uiData;

    return (
        <Spotlight
            show={show}
            onClose={onClose}
            originalPlacement="top"
            innerClassName="p-6 pt-8"
            borderRadius="xl"
            content={
                <div className="flex flex-column justify-center items-center gap-4">
                    <h1 className="m-0 text-semibold text-lg">{c('Referral').t`Invite friends. Get credits.`}</h1>

                    <span
                        className="color-weak inline-block mx-auto px-3 py-1 rounded text-semibold"
                        style={{
                            background:
                                'linear-gradient(85.16deg, var(--promotion-background-start) 0%, var(--promotion-background-end) 100%)',
                            color: 'var(--promotion-text-color)',
                        }}
                    >
                        {c('Referral').t`${referrerRewardAmount} per referral`}
                    </span>

                    <ol className="unstyled flex flex-column gap-4 m-0">
                        <li className="flex flex-nowrap items-start gap-4">
                            <img
                                src={step1}
                                alt=""
                                className="w-custom shrink-0 ratio-square"
                                style={{ '--w-custom': '3rem' }}
                            />
                            <div>
                                {getBoldFormattedText(
                                    c('Info')
                                        .t`**Step 1:** Invite your friends to ${BRAND_NAME} with your referral link.`
                                )}
                            </div>
                        </li>
                        <li className="flex flex-nowrap items-start gap-4">
                            <img
                                src={step2}
                                alt=""
                                className="w-custom shrink-0 ratio-square"
                                style={{ '--w-custom': '3rem' }}
                            />
                            <div>
                                {getBoldFormattedText(
                                    c('Info').t`**Step 2:** Your friends get 2 weeks for free on their plan.`
                                )}
                            </div>
                        </li>
                        <li className="flex flex-nowrap items-start gap-4">
                            <img
                                src={step3}
                                alt=""
                                className="w-custom shrink-0 ratio-square"
                                style={{ '--w-custom': '3rem' }}
                            />
                            <div>
                                {getBoldFormattedText(
                                    c('Info')
                                        .t`**Step 3:** Get ${referrerRewardAmount} in credits for every person that subscribes to a plan.`
                                )}{' '}
                                <Href href={getKnowledgeBaseUrl('/referral-program')}>{c('Link').t`Learn more`}</Href>
                            </div>
                        </li>
                    </ol>

                    <p className="m-0">
                        {getBoldFormattedText(c('Referral').t`You can get up to **${maxRewardAmount}** in credit.`)}
                    </p>

                    <ButtonLike
                        as={SettingsLink}
                        target="_blank"
                        path="/referral"
                        app={currentApp}
                        fullWidth
                        color="norm"
                        shape="solid"
                        className="mt-2"
                    >{c('Referral').t`Start earning credits`}</ButtonLike>

                    <Button shape="underline" color="norm" className="text-sm" onClick={onDismiss}>
                        {c('Label').t`Don't show this again`}
                    </Button>
                </div>
            }
        >
            {children}
        </Spotlight>
    );
};
