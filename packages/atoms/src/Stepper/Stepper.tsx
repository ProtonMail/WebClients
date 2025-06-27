import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import { Children, cloneElement, isValidElement, useMemo } from 'react';

import clsx from '@proton/utils/clsx';

import { Step } from './Step';
import { StepIndicator } from './StepIndicator';
import { StepperContext } from './StepperContext';

import './Stepper.scss';

export enum StepperPositionEnum {
    Start = 'start',
    // eslint-disable-next-line custom-rules/deprecate-classes
    Center = 'center',
    End = 'end',
}

export interface StepperProps extends ComponentPropsWithoutRef<'div'> {
    /**
     * Index of the currently active step.
     */
    activeStep: number;
    /**
     * Sets the position of the steps. Defaults to `center`.
     */
    position?: StepperPositionEnum;
}

export const Stepper = ({
    activeStep,
    position = StepperPositionEnum.Center,
    className,
    children,
    ...rest
}: StepperProps) => {
    const childrenArray = Children.toArray(children).filter((child) => isValidElement(child) && child.type === Step);

    const stepIndicators = childrenArray.map((step, index) => {
        return <StepIndicator index={index} key={(step as ReactElement).key} />;
    });

    const steps = childrenArray.map((step, index) => {
        return cloneElement(step as ReactElement, {
            index,
            ...(step as ReactElement).props,
        });
    });

    const contextValue = useMemo(() => ({ activeStep }), [activeStep]);

    const sharedUlClasses = clsx('unstyled flex *:min-size-auto gap-2 flex-nowrap m-0', `justify-${position}`);

    return (
        <StepperContext.Provider value={contextValue}>
            <div className={clsx('stepper', className)} {...rest}>
                <ul className={clsx('stepper-indicators', sharedUlClasses)} aria-hidden="true">
                    {stepIndicators}
                </ul>
                <ul className={clsx('stepper-labels', sharedUlClasses)}>{steps}</ul>
            </div>
        </StepperContext.Provider>
    );
};
