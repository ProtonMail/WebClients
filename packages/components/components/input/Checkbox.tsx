import { forwardRef, InputHTMLAttributes, Ref, useEffect, useRef } from 'react';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers';
import { useCombinedRefs } from '../../hooks';

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
    loading?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    color?: string;
    indeterminate?: boolean;
    labelOnClick?: (event: React.MouseEvent<HTMLLabelElement, MouseEvent>) => void;
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
        ...rest
    }: Props,
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
                    <Icon className="checkbox-fakecheck-img" size={16} name="check" color={color} />
                ) : (
                    <Icon className="checkbox-fakecheck-img color-disabled" size={16} name="dash" />
                )}
            </span>
            {children}
        </label>
    );
};

export default forwardRef<HTMLInputElement, Props>(Checkbox);
