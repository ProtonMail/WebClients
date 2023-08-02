import { useEffect } from 'react';

import { c } from 'ttag';

import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Main from '../public/Main';
import { LoadingTextStepper } from '../signup/LoadingStep';
import Layout from './Layout';
import illustration from './business-onboarding-illustration.svg';

const Step4 = ({
    onSetup,
    product,
    isB2bPlan,
    isDarkBg,
}: {
    onSetup: () => Promise<void>;
    product: string;
    isB2bPlan: boolean;
    isDarkBg: boolean;
}) => {
    const steps: string[] = [c('Info').t`Saving your password`, c('Info').t`Setting up your organization`].filter(
        isTruthy
    );

    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    return (
        <Layout hasDecoration={false} isB2bPlan={isB2bPlan} isDarkBg={isDarkBg}>
            <Main>
                <Content>
                    <div className="text-center pt-6" role="alert">
                        <h1 className="h2 text-bold">{c('Info').t`Welcome`}</h1>
                        <span className="color-weak">{c('Info').t`to ${product} Business`}</span>
                    </div>
                    <div className="pb-4 text-center m-auto w100 on-mobile-w100">
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
