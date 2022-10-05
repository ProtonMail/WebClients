import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

export interface StepListItemProps extends ComponentPropsWithoutRef<'li'> {
    firstItem: boolean;
    active: boolean;
    complete: boolean;
}

const StepListItem = ({ firstItem, active, complete, children, className, ...rest }: StepListItemProps) => {
    return (
        <li
            {...rest}
            className={clsx(
                'stepper-item',
                active && 'stepper-item--active',
                complete && 'stepper-item--completed',
                className
            )}
            aria-current={active ? 'step' : false}
        >
            {children}
        </li>
    );
};

export default StepListItem;
