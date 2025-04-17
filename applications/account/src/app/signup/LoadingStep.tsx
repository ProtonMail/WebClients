import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { EllipsisLoader, Loader, LoadingTextStepper, useConfig } from '@proton/components';
import useInterval from '@proton/hooks/useInterval';
import metrics from '@proton/metrics';
import noop from '@proton/utils/noop';

import { getSignupApplication } from './helper';

export const FakeLoadingTextStepper = ({ steps }: { steps: string[] }) => {
    const [stepIndex, setStepIndex] = useState(0);

    useInterval(() => {
        const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
        setStepIndex(nextIndex);
    }, 2500);

    return <LoadingTextStepper steps={steps} stepIndex={stepIndex} hideFutureSteps={true} />;
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
