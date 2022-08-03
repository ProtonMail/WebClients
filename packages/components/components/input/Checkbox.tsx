import { InputHTMLAttributes, forwardRef, useEffect, useRef } from 'react';

import { classnames } from '../../helpers';
import { useCombinedRefs } from '../../hooks';
import Icon from '../icon/Icon';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    /**
     * Interactions will be blocked while loading is true
     */
    loading?: boolean;
    /**
     * Background color can be set using a css color (e.g. #ff0000 or rgb(255, 0, 0))
     */
    backgroundColor?: string;
    /**
     * Border color can be set using a css color (e.g. #ff0000 or rgb(255, 0, 0))
     */
    borderColor?: string;
    /**
     * Color can be set using a css color (e.g. #ff0000 or rgb(255, 0, 0))
     */
    color?: string;
    indeterminate?: boolean;
    labelOnClick?: (event: React.MouseEvent<HTMLLabelElement, MouseEvent>) => void;
}

const Checkbox = forwardRef<HTMLInputElement, Props>(
    (
        {
            id,
            className,
            title,
            loading,
            disabled,
            checked,
            indeterminate = false,
            color,
            backgroundColor,
            borderColor,
            children,
            labelOnClick,
            ...rest
        },
        ref
    ) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const combinedRef = useCombinedRefs(inputRef, ref);

        useEffect(() => {
            if (inputRef.current) {
                inputRef.current.indeterminate = indeterminate;
            }
        }, [indeterminate]);

        return (
            <label
                htmlFor={id}
                className={classnames([
                    'checkbox-container',
                    !className?.includes('increase-click-surface') && 'relative',
                    className,
                ])}
                title={title}
                onClick={labelOnClick}
            >
                <input
                    ref={combinedRef}
                    disabled={disabled || loading}
                    id={id}
                    type="checkbox"
                    className="checkbox-input"
                    checked={checked}
                    {...rest}
                />
                <span className="checkbox-fakecheck" style={{ borderColor, background: backgroundColor, color }}>
                    {indeterminate === false ? (
                        <Icon className="checkbox-fakecheck-img" size={16} name="checkmark" color={color} />
                    ) : (
                        <Icon className="checkbox-fakecheck-img color-disabled" size={16} name="minus" />
                    )}
                </span>
                {children}
            </label>
        );
    }
);

export default Checkbox;
