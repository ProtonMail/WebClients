import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { FakeLoadingTextStepper } from '../signup/FakeLoadingTextStepper';

const Step2 = ({
    onSetup,
    steps,
    product,
    img,
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
        <Main>
            <Content>
                <Header center title={c('Info').t`Thank you`} subTitle={c('Info').t`for choosing ${product}`} />
                <div className="pb-4 text-center m-auto w-full mt-6">{img}</div>
                <div className="text-center pt-7 md:pt-0" role="alert">
                    <div className="inline-block w-7/10">
                        <FakeLoadingTextStepper steps={steps} />
                    </div>
                </div>
            </Content>
        </Main>
    );
};

export default Step2;
