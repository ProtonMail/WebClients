import { c, msgid } from 'ttag';

import clsx from '@proton/utils/clsx';

import './StepLabel.scss';

export enum StepLabelSize {
    small,
    large,
}

const getStep = (step: number) => {
    return c('Info').ngettext(msgid`Step ${step}`, `Step ${step}`, step);
};
const StepLabel = ({
    step,
    size = StepLabelSize.large,
    className,
}: {
    step: number;
    size?: StepLabelSize;
    className?: string;
}) => (
    <span
        className={clsx(
            'step-label-v2 flex items-center justify-center w-custom text-bold rounded-full ratio-square relative',
            size === StepLabelSize.large && 'text-lg',
            size === StepLabelSize.small && 'text-sm',
            className
        )}
        style={{ '--w-custom': size === StepLabelSize.large ? '2rem' : '1.5rem' }}
        title={getStep(step)}
    >
        {step}
    </span>
);

export default StepLabel;
