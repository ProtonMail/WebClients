import { ComponentPropsWithoutRef, useContext } from 'react';

import clsx from '@proton/utils/clsx';

import StepperContext from './StepperContext';

export interface StepProps extends ComponentPropsWithoutRef<'li'> {}

const Step = ({
    index,
    children,
    className,
    ...rest
}: StepProps & {
    /**
     * `index` of the step. Added automatically by Stepper.
     */
    index?: number;
}) => {
    const { activeStep } = useContext(StepperContext);

    const firstItem = index === 0;
    const active = index === activeStep;
    const complete = index !== undefined && index < activeStep;

    const highlightStep = active || complete;

    return (
        <li
            {...rest}
            className={clsx(
                'stepper-item',
                'relative flex-item-fluid flex flex-column flex-align-items-center flex-nowrap',
                !firstItem && 'ml0-5',
                active && 'stepper-item--active',
                complete && 'stepper-item--completed',
                className
            )}
            aria-current={active ? 'step' : false}
        >
            {!firstItem && <div className="stepper-item-connector" />}
            <span className="stepper-item-dot" />
            <span
                className={clsx(
                    'stepper-item-label',
                    'mt0-5 text-semibold text-sm text-center block',
                    !highlightStep && 'color-weak'
                )}
            >
                {children}
            </span>
        </li>
    );
};

export default Step;
