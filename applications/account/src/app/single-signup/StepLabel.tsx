import { c, msgid } from 'ttag';

import './StepLabel.scss';

const getStep = (step: number) => {
    return c('Info').ngettext(msgid`Step ${step}`, `Step ${step}`, step);
};
const StepLabel = ({ step }: { step: number }) => {
    return (
        <span className="step-label py-0-5 bg-norm-weak color-primary text-sm text-bold rounded-sm">
            {getStep(step)}
        </span>
    );
};

export default StepLabel;
