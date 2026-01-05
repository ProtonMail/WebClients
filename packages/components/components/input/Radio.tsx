import type { InputHTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    className?: string;
    name: string;
    disabled?: boolean;
}

const Radio = ({ id, children, className = 'inline-flex', name, disabled = false, ...rest }: Props) => (
    <label
        htmlFor={id}
        className={clsx([
            !className?.includes('expand-click-area') && 'relative',
            disabled && 'opacity-50 pointer-events-none',
            className,
        ])}
    >
        <input id={id} type="radio" className="radio sr-only" name={name} disabled={disabled} {...rest} />
        <span className={clsx('radio-fakeradio checkbox-fakecheck shrink-0', children ? 'mr-2' : '')} />
        {children}
    </label>
);

export default Radio;
