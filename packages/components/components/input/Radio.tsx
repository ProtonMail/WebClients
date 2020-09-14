import React from 'react';
import { classnames } from '../../helpers';

export interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    className?: string;
    name: string;
}

const Radio = ({ id, children, className = 'inline-flex', name, ...rest }: Props) => (
    <label
        htmlFor={id}
        className={classnames([!className?.includes('increase-surface-click') && 'relative', className])}
    >
        <input id={id} type="radio" className="pm-radio" name={name} {...rest} />
        <span className="pm-radio-fakeradio" />
        {children}
    </label>
);

export default Radio;
