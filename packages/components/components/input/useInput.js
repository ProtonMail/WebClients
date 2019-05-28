import { useState } from 'react';
import keycode from 'keycode';

const FOCUSED_CLASS = 'focused';
const BLURRED_CLASS = 'blurred';
const DIRTY_CLASS = 'dirty';
const PRISTINE_CLASS = 'pristine';

const DEFAULT_STATE = {
    isFocused: false,
    isBlurred: false,
    isDirty: false,
    isPristine: true
};

const useInput = (props, initialState = DEFAULT_STATE, prefix = 'field') => {
    const [status, changeStatus] = useState(initialState);
    const { isFocused, isBlurred, isPristine, isDirty } = status;

    const reset = () => {
        changeStatus({ ...DEFAULT_STATE });
    };

    const classes = [];

    if (isPristine) {
        classes.push(PRISTINE_CLASS);
    } else {
        isFocused && classes.push(`${prefix}-${FOCUSED_CLASS}`);
        isBlurred && classes.push(`${prefix}-${BLURRED_CLASS}`);
        isDirty && classes.push(`${prefix}-${DIRTY_CLASS}`);
    }

    const { onFocus, onBlur, onChange, onPressEnter, onKeyDown, disabled } = props;

    return {
        status,
        statusClasses: classes.join(' '),
        reset,
        handlers: {
            onFocus: (event) => {
                if (disabled) {
                    return;
                }

                if (!isFocused) {
                    changeStatus({
                        ...status,
                        isFocused: true,
                        isPristine: false
                    });
                }

                if (onFocus) {
                    onFocus(event);
                }
            },
            onBlur: (event) => {
                if (!isBlurred) {
                    changeStatus({
                        ...status,
                        isBlurred: true,
                        isPristine: false
                    });
                }

                if (onBlur) {
                    onBlur(event);
                }
            },
            onChange: (event) => {
                if (!isDirty) {
                    changeStatus({
                        ...status,
                        isDirty: true,
                        isPristine: false
                    });
                }

                if (onChange) {
                    onChange(event);
                }
            },
            onKeyDown: (event) => {
                const key = keycode(event);

                if (key === 'enter' && onPressEnter) {
                    onPressEnter(event);
                }

                if (onKeyDown) {
                    onKeyDown(event);
                }
            }
        }
    };
};

export default useInput;
