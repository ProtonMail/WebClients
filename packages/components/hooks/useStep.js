import { useState } from 'react';

const useStep = (initialStep = 0) => {
    const [step, updateStep] = useState(initialStep);
    const next = () => updateStep(step + 1);
    const previous = () => updateStep(step - 1);
    const goTo = (s) => updateStep(s);

    return {
        step,
        next,
        previous,
        goTo
    };
};

export default useStep;
