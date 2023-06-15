import { ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import metrics from '@proton/metrics';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Main from '../public/Main';
import { LoadingTextStepper } from '../signup/LoadingStep';
import Layout from './Layout';

const Step4 = ({
    planName,
    onSetup,
    img,
    steps,
}: {
    planName: string;
    onSetup: () => Promise<void>;
    img: ReactNode;
    steps: string[];
}) => {
    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    useEffect(() => {
        metrics.core_vpn_single_signup_pageLoad_total.increment({ step: 'saving_password' });
    }, []);

    return (
        <Layout hasDecoration={false}>
            <Main>
                <Content>
                    <div className="text-center pt-6">
                        <h1 className="h2 text-bold">{c('Info').t`Welcome`}</h1>
                        <span className="color-weak">{c('Info').t`To ${planName}`}</span>
                    </div>
                    <div className="mt-8 mb-6 text-center m-auto w100 on-mobile-w100">{img}</div>
                    <div className="text-center" role="alert">
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
