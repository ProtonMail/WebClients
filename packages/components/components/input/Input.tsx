import React, { KeyboardEventHandler, Ref, useState } from 'react';
import { c } from 'ttag';

import { generateUID, classnames } from '../../helpers';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    ref?: Ref<HTMLInputElement>; // override ref so that LegacyRef isn't used
    containerRef?: Ref<HTMLDivElement>;
    icon?: React.ReactElement;
    error?: string;
    errorZoneClassName?: string;
    autoComplete?: string;
    className?: string;
    onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
    isSubmitted?: boolean;
    loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, Props>(
    (
        {
            containerRef,
            icon,
            error,
            errorZoneClassName,
            autoComplete = 'off',
            className = '',
            type = 'text',
            onPressEnter,
            isSubmitted,
            loading = false,
            required = false,
            id,
            placeholder,
            value,
            ...rest
        },
        ref
    ) => {
        const { handlers, statusClasses, status } = useInput<HTMLInputElement>({ onPressEnter, ...rest });
        const [uid] = useState(generateUID('input'));
        const errorZone = required && !value && value !== 0 && !error ? c('Error').t`This field is required` : error;

        const hasError = !!(errorZone && (status.isDirty || isSubmitted));

        const addIconWrapper = (child: React.ReactNode) => {
            if (!icon) {
                return child;
            }

            return (
                <div
                    ref={containerRef}
                    className={classnames([
                        'relative pm-field-icon-container w100',
                        hasError && 'pm-field-icon-container--invalid',
                    ])}
                >
                    {child}
                    {React.cloneElement(icon, {
                        className: classnames([icon.props.className, 'right-icon absolute flex']),
                    })}
                </div>
            );
        };

        return (
            <>
                {id && placeholder ? (
                    <label className="sr-only" htmlFor={id}>
                        {placeholder}
                    </label>
                ) : null}
                {addIconWrapper(
                    <input
                        className={classnames(['pm-field w100', className, statusClasses])}
                        aria-invalid={hasError}
                        aria-describedby={uid}
                        id={id}
                        ref={ref}
                        type={type}
                        value={value}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        disabled={loading || rest.disabled}
                        required={required}
                        {...rest}
                        {...handlers}
                    />
                )}

                {hasError && (
                    <ErrorZone className={errorZoneClassName} id={uid}>
                        {errorZone}
                    </ErrorZone>
                )}
            </>
        );
    }
);

export default Input;
