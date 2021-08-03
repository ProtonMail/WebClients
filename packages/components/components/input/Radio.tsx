import * as React from 'react';
import { classnames } from '../../helpers';

export interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    className?: string;
    name: string;
}

const Radio = ({ id, children, className = 'inline-flex', name, ...rest }: Props) => (
    <label
        htmlFor={id}
        className={classnames([!className?.includes('increase-click-surface') && 'relative', className])}
    >
        <input id={id} type="radio" className="radio" name={name} {...rest} />
        <span className="radio-fakeradio" />
        {children}
    </label>
);

export default Radio;
