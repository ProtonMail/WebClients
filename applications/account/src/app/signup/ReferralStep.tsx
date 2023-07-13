import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ReferralFeaturesList, useConfig } from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { MAIL_APP_NAME, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { PlanIDs } from '@proton/shared/lib/interfaces';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';
import { getSignupApplication } from './helper';

type PlanType = 'free' | 'trial';

interface Props {
    onPlan: (planIDs: PlanIDs) => Promise<void>;
    onBack?: () => void;
}

const ReferralStep = ({ onPlan, onBack }: Props) => {
    const { APP_NAME } = useConfig();
    const [type, setType] = useState<PlanType | undefined>(undefined);
    const [loading, withLoading] = useLoading();
    const mailPlus = PLAN_NAMES[PLANS.MAIL];

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'referral',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    return (
        <Main>
            <Header title={c('Heading in trial plan').t`Try the best of ${MAIL_APP_NAME} for free`} onBack={onBack} />
            <Content>
                <Text>
                    {c('Baseline in trial plan')
                        .t`${mailPlus}: the privacy-first Mail and Calendar solution for your everyday communications needs.`}
                </Text>
                <ReferralFeaturesList />
                <Button
                    loading={loading && type === 'trial'}
                    disabled={loading}
                    color="norm"
                    shape="solid"
                    size="large"
                    className="mb-2"
                    onClick={() => {
                        setType('trial');
                        void withLoading(onPlan({ [PLANS.MAIL]: 1 }));
                    }}
                    fullWidth
                >{c('Action in trial plan').t`Try free for 30 days`}</Button>
                <p className="text-center mt-0 mb-2">
                    <small className="color-weak">{c('Info').t`No credit card required`}</small>
                </p>
                <Button
                    loading={loading && type === 'free'}
                    disabled={loading}
                    size="large"
                    color="norm"
                    shape="ghost"
                    onClick={() => {
                        setType('free');
                        void withLoading(onPlan({}));
                    }}
                    fullWidth
                >{c('Action in trial plan').t`No, thanks`}</Button>
            </Content>
        </Main>
    );
};

export default ReferralStep;
