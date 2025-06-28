import { useContext } from 'react';

import clsx from '@proton/utils/clsx';

import type { StepListItemProps } from './StepListItem';
import { StepListItem } from './StepListItem';
import { StepperContext } from './StepperContext';

export interface StepProps extends Omit<StepListItemProps, 'firstItem' | 'active' | 'complete' | 'children'> {
    children?: string;
}

export const Step = ({
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

    return (
        <StepListItem
            firstItem={firstItem}
            active={active}
            complete={complete}
            className={clsx('stepper-label flex-1', className)}
            {...rest}
        >
            <span
                className={clsx(
                    'mt-2 text-sm text-center text-ellipsis-two-lines',
                    active && 'text-semibold',
                    !active && 'opacity-70'
                )}
                title={children}
                {...rest}
            >
                {children}
            </span>
        </StepListItem>
    );
};
