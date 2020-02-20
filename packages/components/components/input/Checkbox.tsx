import React, { useEffect, useRef } from 'react';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers/component';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
    loading?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
    indeterminate?: boolean;
}

const Checkbox = ({
    id,
    className,
    loading,
    disabled,
    checked,
    indeterminate = false,
    color,
    backgroundColor,
    borderColor,
    children,
    ...rest
}: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <label htmlFor={id} className={classnames(['inline-flex', className])}>
            <input
                ref={inputRef}
                disabled={disabled || loading}
                id={id}
                type="checkbox"
                className="pm-checkbox"
                checked={checked}
                {...rest}
            />
            <span
                className="pm-checkbox-fakecheck"
                style={{ borderColor: borderColor, background: backgroundColor, color }}
            >
                <Icon className="pm-checkbox-fakecheck-img" name="on" color={color} fill={color ? '' : undefined} />
            </span>
            {children}
        </label>
    );
};

export default Checkbox;
