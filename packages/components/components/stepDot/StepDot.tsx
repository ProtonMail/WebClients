import React from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers';

/*
 * 'type' is string in HTMLButtonElement but the button React elements wants a union between
 * the possible values for types, omitting for now due to incompatibility
 */
export interface Props extends Omit<React.HTMLProps<HTMLButtonElement>, 'onChange' | 'type'> {
    onChange?: (index: number | undefined) => void;
    index?: number;
    active?: boolean;
}

const StepDot = ({ index, className, onChange, active, role = 'presentation', ...rest }: Props) => {
    function handleClick() {
        if (onChange) {
            onChange(index);
        }
    }

    return (
        <li className="stepDots-item" role={role}>
            <button
                type="button"
                role="tab"
                aria-selected={active}
                className={classnames([className, 'stepDots-dot'])}
                title={c('Action').t`Go to panel ${index}`}
                onClick={handleClick}
                {...rest}
            >
                <span className="sr-only">{c('Action').t`Go to panel ${index}`}</span>
            </button>
        </li>
    );
};

export default StepDot;
