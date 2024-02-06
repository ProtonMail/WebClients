import { c, msgid } from 'ttag';

import './StepLabel.scss';

const getStep = (step: number) => {
    return c('Info').ngettext(msgid`Step ${step}`, `Step ${step}`, step);
};
const StepLabel = ({ step }: { step: number }) => {
    return <span className="step-label-v2 py-1 px-1.5 text-sm text-bold rounded-full">{getStep(step)}</span>;
};

export default StepLabel;
