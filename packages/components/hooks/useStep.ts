import { useState } from 'react';

const useStep = (initialStep = 0) => {
    const [step, updateStep] = useState(initialStep);
    const next = () => updateStep((s) => s + 1);
    const previous = () => updateStep((s) => s - 1);
    const goTo = (s: number) => updateStep(s);

    return {
        step,
        next,
        previous,
        goTo,
    };
};

export default useStep;
