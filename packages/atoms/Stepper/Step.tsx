import { useContext } from 'react';

import clsx from '@proton/utils/clsx';

import StepListItem, { StepListItemProps } from './StepListItem';
import StepperContext from './StepperContext';

export interface StepProps extends Omit<StepListItemProps, 'firstItem' | 'active' | 'complete'> {}

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

    return (
        <StepListItem
            firstItem={firstItem}
            active={active}
            complete={complete}
            className={clsx('stepper-label flex-item-fluid', className)}
            {...rest}
        >
            <span
                className={clsx(
                    'mt0-5 text-semibold text-sm text-center text-ellipsis-two-lines',
                    !active && 'color-weak'
                )}
                title={children?.toString()}
                {...rest}
            >
                {children}
            </span>
        </StepListItem>
    );
};

export default Step;
