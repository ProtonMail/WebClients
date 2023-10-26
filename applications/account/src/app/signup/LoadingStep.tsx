import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Icon, useConfig } from '@proton/components';
import useInterval from '@proton/hooks/useInterval';
import metrics from '@proton/metrics';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import accountSetupImg from '@proton/styles/assets/img/illustrations/account-setup.svg';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Main from '../public/Main';
import { getSignupApplication } from './helper';

export const LoadingTextStepper = ({ steps }: { steps: string[] }) => {
    const [stepIndex, setStepIndex] = useState(0);

    useInterval(() => {
        const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
        setStepIndex(nextIndex);
    }, 2500);

    return (
        <>
            {steps.map((step, i) => {
                const isCurrentStep = i === stepIndex;
                const isVisibleStep = i <= stepIndex;
                if (!isVisibleStep) {
                    return null;
                }

                return (
                    <div className="text-lg" key={step}>
                        <div
                            className={clsx(
                                'flex-no-min-children flex-align-items-center flex-nowrap',
                                isCurrentStep && 'color-primary'
                            )}
                        >
                            <div className="mr-2 min-w2e flex flex-item-noshrink">
                                {isCurrentStep ? (
                                    <CircleLoader size="small" className="ml-1" />
                                ) : (
                                    <Icon size={24} className="color-success" name="checkmark" />
                                )}
                            </div>
                            <div className="flex-item-fluid p-2 text-left">{step}</div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

interface Props {
    onSetup: () => Promise<void>;
    hasPayment?: boolean;
    toApp?: APP_NAMES;
}

const LoadingStep = ({ onSetup, hasPayment, toApp }: Props) => {
    const { APP_NAME } = useConfig();

    const driveIntent = toApp === APPS.PROTONDRIVE;
    const steps: string[] = [
        c('Info').t`Creating your account`,
        c('Info').t`Securing your account`,
        hasPayment && c('Info').t`Verifying your payment`,
        driveIntent && c('Info').t`Setting up your Drive`,
    ].filter(isTruthy);

    useEffect(() => {
        onSetup().catch(noop);
    }, []);

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'loading',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    return (
        <Main>
            <Content>
                <div className="text-center pt-6 sm:pt-0" role="alert">
                    <img className="m-4" width="140" height="140" src={accountSetupImg} alt="" />

                    <hr className="my-8" />
                    <div className="inline-block">
                        <LoadingTextStepper steps={steps} />
                    </div>
                </div>
            </Content>
        </Main>
    );
};

export default LoadingStep;
