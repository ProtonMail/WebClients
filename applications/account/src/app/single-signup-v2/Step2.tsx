import { ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { LoadingTextStepper } from '../signup/LoadingStep';
import Layout from './Layout';

const Step2 = ({
    onSetup,
    steps,
    product,
    img,
    logo,
}: {
    steps: string[];
    onSetup: () => Promise<void>;
    product: string;
    img: ReactNode;
    logo: ReactNode;
}) => {
    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    return (
        <Layout logo={logo} hasDecoration={false}>
            <Main>
                <Content>
                    <Header center title={c('Info').t`Thank you`} subTitle={c('Info').t`for choosing ${product}`} />
                    <div className="pb-4 text-center m-auto w100 on-mobile-w100 mt-6">{img}</div>
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
