import { c, msgid } from 'ttag';

import './StepLabel.scss';

const getStep = (step: number) => {
    return c('Info').ngettext(msgid`Step ${step}`, `Step ${step}`, step);
};
const StepLabel = ({ step }: { step: number }) => (
    <span
        className="step-label-v2 flex items-center justify-center w-custom text-lg text-bold rounded-full ratio-square relative"
        style={{ '--w-custom': '2rem' }}
        title={getStep(step)}
    >
        {step}
    </span>
);

export default StepLabel;
