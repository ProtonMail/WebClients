import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import noop from '@proton/utils/noop';

import Content from '../layout/Content';
import Header from '../layout/Header';
import Main from '../layout/Main';
import { FakeLoadingTextStepper } from '../signup/FakeLoadingTextStepper';

const Step2 = ({
    onSetup,
    onRetry,
    error,
    steps,
    product,
    img,
}: {
    steps: string[];
    onSetup: () => Promise<void>;
    onRetry?: () => void;
    /** Message of a failure that can be retried. */
    error?: string;
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
                    {error ? (
                        <div className="inline-block w-7/10">
                            <p className="mt-0 mb-2">
                                {c('Info').t`Your account was created, but we couldn't finish setting up your plan.`}
                            </p>
                            <p className="mt-0 mb-4 color-weak">{error}</p>
                            <Button color="norm" onClick={onRetry}>{c('Action').t`Try again`}</Button>
                        </div>
                    ) : (
                        <div className="inline-block w-7/10">
                            <FakeLoadingTextStepper steps={steps} />
                        </div>
                    )}
                </div>
            </Content>
        </Main>
    );
};

export default Step2;
