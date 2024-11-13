import type { HTMLProps } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

/*
 * 'type' is string in HTMLButtonElement but the button React elements wants a union between
 * the possible values for types, omitting for now due to incompatibility
 */
export interface Props extends Omit<HTMLProps<HTMLButtonElement>, 'onChange' | 'type'> {
    index?: number;
    active?: boolean;
}

const StepDot = ({ index, className, onClick, active, role = 'presentation', ...rest }: Props) => (
    <li className="step-dots-item" role={role}>
        <button
            type="button"
            role="tab"
            aria-selected={active}
            className={clsx([className, 'step-dots-dot', 'rounded-50', !onClick && 'pointer-events-none'])}
            onClick={onClick}
            title={onClick ? c('Action').t`Go to panel ${index}` : undefined}
            {...rest}
        >
            <span className="sr-only">{c('Action').t`Go to panel ${index}`}</span>
        </button>
    </li>
);

export default StepDot;
