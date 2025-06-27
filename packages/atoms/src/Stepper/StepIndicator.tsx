import { useContext } from 'react';

import clsx from '@proton/utils/clsx';

import type { StepListItemProps } from './StepListItem';
import { StepListItem } from './StepListItem';
import { StepperContext } from './StepperContext';

export interface StepIndicatorProps extends Omit<StepListItemProps, 'firstItem' | 'active' | 'complete'> {}

export const StepIndicator = ({
    index,
    className,
    ...rest
}: StepIndicatorProps & {
    /**
     * `index` of the step. Added automatically by Stepper.
     */
    index?: number;
}) => {
    const { activeStep } = useContext(StepperContext);

    const firstItem = index === 0;
    const active = index === activeStep;
    const complete = index !== undefined && index < activeStep;

    return (
        <StepListItem
            firstItem={firstItem}
            active={active}
            complete={complete}
            className={clsx('relative flex-1 flex flex-column items-center flex-nowrap', className)}
            {...rest}
        >
            {!firstItem && <div className="stepper-item-connector" />}
            <span className="stepper-item-dot" />
        </StepListItem>
    );
};
