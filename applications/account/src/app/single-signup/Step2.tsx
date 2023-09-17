import { ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import metrics from '@proton/metrics';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Main from '../public/Main';
import { LoadingTextStepper } from '../signup/LoadingStep';
import Layout, { Background } from './Layout';

const Step2 = ({
    onSetup,
    product,
    img,
    isB2bPlan,
    background,
    hasPayment,
}: {
    onSetup: () => Promise<void>;
    product: string;
    img: ReactNode;
    isB2bPlan: boolean;
    background?: Background;
    hasPayment: boolean;
}) => {
    const steps: string[] = [
        hasPayment && c('Info').t`Verifying your payment`,
        c('Info').t`Creating your account`,
        c('Info').t`Securing your account`,
    ].filter(isTruthy);

    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    useEffect(() => {
        metrics.core_vpn_single_signup_pageLoad_2_total.increment({
            step: 'account_setup',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, []);

    return (
        <Layout hasDecoration={false} isB2bPlan={isB2bPlan} background={background}>
            <Main>
                <Content>
                    <div className="text-center pt-6" role="alert">
                        <h1 className="h2 text-bold">{c('Info').t`Thank you`}</h1>
                        <span className="color-weak">{c('Info').t`for choosing ${product}`}</span>
                    </div>
                    <div className="pb-4 text-center m-auto w100">{img}</div>
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

export default Step2;
