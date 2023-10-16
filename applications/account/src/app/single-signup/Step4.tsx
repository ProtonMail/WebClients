import { useEffect } from 'react';

import { c } from 'ttag';

import metrics from '@proton/metrics';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Main from '../public/Main';
import { LoadingTextStepper } from '../signup/LoadingStep';
import Layout, { Background } from './Layout';
import illustration from './business-onboarding-illustration.svg';

const Step4 = ({
    onSetup,
    product,
    isB2bPlan,
    background,
}: {
    onSetup: () => Promise<void>;
    product: string;
    isB2bPlan: boolean;
    background?: Background;
}) => {
    const steps: string[] = [c('Info').t`Saving your password`, c('Info').t`Setting up your organization`].filter(
        isTruthy
    );

    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    useEffect(() => {
        metrics.core_vpn_single_signup_pageLoad_2_total.increment({
            step: 'org_setup',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, []);

    return (
        <Layout hasDecoration={false} isB2bPlan={isB2bPlan} background={background}>
            <Main>
                <Content>
                    <div className="text-center pt-6" role="alert">
                        <h1 className="h2 text-bold">{c('Info').t`Welcome`}</h1>
                        <span className="color-weak">{c('Info').t`to ${product} Business`}</span>
                    </div>
                    <div className="pb-4 text-center m-auto w100">
                        <img src={illustration} alt={c('Onboarding').t`Welcome to ${product}`} />
                    </div>
                    <div className="text-center pt-7 md:pt-0" role="alert">
                        <div className="inline-block w70">
                            <LoadingTextStepper steps={steps} />
                        </div>
                    </div>
                </Content>
            </Main>
        </Layout>
    );
};

export default Step4;
