import { InputHTMLAttributes } from 'react';

import { classnames } from '../../helpers';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    className?: string;
    name: string;
    disabled?: boolean;
}

const Radio = ({ id, children, className = 'inline-flex', name, disabled = false, ...rest }: Props) => (
    <label
        htmlFor={id}
        className={classnames([
            !className?.includes('increase-click-surface') && 'relative',
            disabled && 'no-pointer-events',
            className,
        ])}
    >
        <input id={id} type="radio" className="radio" name={name} disabled={disabled} {...rest} />
        <span className="radio-fakeradio flex-item-noshrink" />
        {children}
    </label>
);

export default Radio;
