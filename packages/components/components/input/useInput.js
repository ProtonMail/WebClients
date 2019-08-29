import { useState, useMemo } from 'react';

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

const useInput = (
    { onFocus, onBlur, onChange, onPressEnter, onKeyDown, disabled },
    initialState = DEFAULT_STATE,
    prefix = 'field'
) => {
    const [status, changeStatus] = useState(initialState);

    const { isFocused, isBlurred, isPristine, isDirty } = status;

    const reset = () => {
        changeStatus({ ...DEFAULT_STATE });
    };

    const statusClasses = useMemo(() => {
        return [
            isPristine && PRISTINE_CLASS,
            isFocused && FOCUSED_CLASS,
            isBlurred && BLURRED_CLASS,
            isDirty && DIRTY_CLASS
        ]
            .filter(Boolean)
            .map((className) => `${prefix}-${className}`)
            .join(' ');
    }, [status, prefix]);

    return {
        status,
        statusClasses,
        reset,
        handlers: {
            onFocus: (event) => {
                if (disabled) {
                    return;
                }

                if (!isFocused) {
                    changeStatus({
                        ...status,
                        isBlurred: false,
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
                        isFocused: false,
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
                if (event.key === 'Enter' && onPressEnter) {
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
