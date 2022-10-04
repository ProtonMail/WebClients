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
    /**
     * Sets the position of the steps. Defaults to `center`.
     */
    position?: 'start' | 'center' | 'end';
}

const Stepper = ({ activeStep, position = 'center', className, children, ...rest }: StepperProps) => {
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
            <ul
                {...rest}
                className={clsx([
                    'stepper',
                    'unstyled m0 flex flex-gap-0-5 flex-nowrap',
                    `flex-justify-${position}`,
                    className,
                ])}
            >
                {steps}
            </ul>
        </StepperContext.Provider>
    );
};

export default Stepper;
