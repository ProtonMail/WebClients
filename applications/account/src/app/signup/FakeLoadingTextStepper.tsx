import { useState } from 'react';

import { LoadingTextStepper } from '@proton/components';
import useInterval from '@proton/hooks/useInterval';

export const FakeLoadingTextStepper = ({ steps }: { steps: string[] }) => {
    const [stepIndex, setStepIndex] = useState(0);

    useInterval(() => {
        const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
        setStepIndex(nextIndex);
    }, 2500);

    return <LoadingTextStepper steps={steps} stepIndex={stepIndex} hideFutureSteps={true} />;
};
