import type { InputHTMLAttributes, LabelHTMLAttributes, Ref } from 'react';
import { forwardRef, useEffect, useRef } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import { useCombinedRefs } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
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
    labelProps?: LabelHTMLAttributes<HTMLLabelElement> & { 'data-testid': string };
}

const Checkbox = (
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
        labelProps,
        ...rest
    }: CheckboxProps,
    ref: Ref<HTMLInputElement>
) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const combinedRef = useCombinedRefs(inputRef, ref);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        <label
            {...labelProps}
            htmlFor={id}
            className={clsx('checkbox-container', !className?.includes('expand-click-area') && 'relative', className)}
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
            <span
                className={clsx('checkbox-fakecheck', children ? 'mr-2' : '')}
                style={{ borderColor, background: backgroundColor, color }}
            >
                {indeterminate === false ? (
                    <Icon className="checkbox-fakecheck-img" size={4} name="checkmark" color={color} />
                ) : (
                    <Icon className="checkbox-fakecheck-img color-disabled" size={4} name="minus" />
                )}
            </span>
            {children}
        </label>
    );
};

export default forwardRef<HTMLInputElement, CheckboxProps>(Checkbox);
