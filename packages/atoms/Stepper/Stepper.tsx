import { Children, ComponentPropsWithoutRef, ReactElement, cloneElement, isValidElement, useMemo } from 'react';

import clsx from '@proton/utils/clsx';

import Step from './Step';
import StepperContext from './StepperContext';

import './Stepper.scss';

export interface StepperProps extends ComponentPropsWithoutRef<'ul'> {
    /**
     * Index of the currently active step.
     */
    activeStep: number;
}

const Stepper = ({ activeStep, className, children, ...rest }: StepperProps) => {
    const childrenArray = Children.toArray(children).filter((child) => isValidElement(child) && child.type === Step);
    const steps = childrenArray.map((step, index) => {
        return cloneElement(step as ReactElement, {
            index,
            ...(step as ReactElement).props,
        });
    });

    const contextValue = useMemo(() => ({ activeStep }), [activeStep]);

    return (
        <StepperContext.Provider value={contextValue}>
            <ul {...rest} className={clsx(['stepper', 'unstyled flex flex-nowrap m0', className])}>
                {steps}
            </ul>
        </StepperContext.Provider>
    );
};

export default Stepper;
