import { ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import metrics from '@proton/metrics';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Main from '../public/Main';
import { LoadingTextStepper } from '../signup/LoadingStep';
import Layout from './Layout';

const Step2 = ({ onSetup, product, img }: { onSetup: () => Promise<void>; product: string; img: ReactNode }) => {
    const steps: string[] = [
        c('Info').t`Creating your account`,
        c('Info').t`Securing your account`,
        c('Info').t`Verifying your payment`,
    ].filter(isTruthy);

    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    useEffect(() => {
        metrics.core_vpn_single_signup_pageLoad_total.increment({ step: 'account_setup' });
    }, []);

    return (
        <Layout hasDecoration={false}>
            <Main>
                <Content>
                    <div className="text-center pt-6" role="alert">
                        <h1 className="h2 text-bold">{c('Info').t`Thank you`}</h1>
                        <span className="color-weak">{c('Info').t`For choosing ${product}`}</span>
                    </div>
                    <div className="pb-4 text-center m-auto w100 on-mobile-w100">{img}</div>
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
