import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { EllipsisLoader, Icon, Loader, useConfig } from '@proton/components';
import useInterval from '@proton/hooks/useInterval';
import metrics from '@proton/metrics';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

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
                                'flex-no-min-children items-center flex-nowrap',
                                isCurrentStep && 'color-primary'
                            )}
                        >
                            <div
                                className="mr-2 min-w-custom flex flex-item-noshrink"
                                style={{ '--min-w-custom': '2em' }}
                            >
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
}

const LoadingStep = ({ onSetup }: Props) => {
    const { APP_NAME } = useConfig();

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
        <div className="text-center inline-block" role="alert" style={{ color: 'var(--promotion-text-weak)' }}>
            <Loader size="medium" className="mb-2" />
            <div>
                {c('Info').t`Creating your account`}
                <EllipsisLoader />
            </div>
        </div>
    );
};

export default LoadingStep;
