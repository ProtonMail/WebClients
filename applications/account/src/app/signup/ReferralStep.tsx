import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ReferralHowItWorks, useLoading } from '@proton/components';
import { BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import { PlanIDs } from '@proton/shared/lib/interfaces';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import Text from '../public/Text';

type PlanType = 'free' | 'trial';

interface Props {
    onPlan: (planIDs: PlanIDs) => Promise<void>;
    onBack?: () => void;
}

const ReferralStep = ({ onPlan, onBack }: Props) => {
    const [type, setType] = useState<PlanType | undefined>(undefined);
    const [loading, withLoading] = useLoading();

    return (
        <Main>
            <Header title={c('Title').t`How your free trial works`} onBack={onBack} />
            <Content>
                <Text>
                    {c('Subtitle for trial plan')
                        .t`This offer is for those new to ${BRAND_NAME} only. No credit card required.`}
                </Text>
                <ReferralHowItWorks />
                <Button
                    loading={loading && type === 'trial'}
                    disabled={loading}
                    color="norm"
                    shape="solid"
                    size="large"
                    className="mb0-5"
                    onClick={() => {
                        setType('trial');
                        void withLoading(onPlan({ [PLANS.MAIL]: 1 }));
                    }}
                    fullWidth
                >{c('Action in trial plan').t`Start my 30-day free trial`}</Button>
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
                >{c('Action in trial plan').t`Continue with free plan`}</Button>
            </Content>
        </Main>
    );
};

export default ReferralStep;
