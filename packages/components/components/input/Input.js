import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { generateUID, classnames } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

/** @type any */
const Input = React.forwardRef(
    (
        {
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
        const { handlers, statusClasses, status } = useInput({ onPressEnter, isSubmitted, ...rest });
        const [uid] = useState(generateUID('input'));
        const errorZone = required && !value && !error ? c('Error').t`This field is required` : error;

        const hasError = errorZone && (status.isDirty || isSubmitted);

        const addIconWrapper = (child) => {
            if (!icon) {
                return child;
            }

            return (
                <div
                    className={classnames([
                        'relative pm-field-icon-container w100',
                        hasError && 'pm-field-icon-container--invalid'
                    ])}
                >
                    {child}
                    {React.cloneElement(icon, {
                        className: classnames([icon.props.className, 'right-icon absolute flex'])
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
                <ErrorZone className={errorZoneClassName} id={uid}>
                    {hasError ? errorZone : ''}
                </ErrorZone>
            </>
        );
    }
);

Input.propTypes = {
    icon: PropTypes.node,
    error: PropTypes.string,
    errorZoneClassName: PropTypes.string,
    autoComplete: PropTypes.string,
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    isSubmitted: PropTypes.bool,
    id: PropTypes.string,
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyDown: PropTypes.func,
    onKeyUp: PropTypes.func,
    onPressEnter: PropTypes.func,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
};

export default Input;
