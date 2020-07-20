import {
    useState,
    useMemo,
    ChangeEvent,
    FocusEvent,
    KeyboardEvent,
    KeyboardEventHandler,
    ChangeEventHandler,
    FocusEventHandler,
} from 'react';

const FOCUSED_CLASS = 'focused';
const BLURRED_CLASS = 'blurred';
const DIRTY_CLASS = 'dirty';
const PRISTINE_CLASS = 'pristine';

const DEFAULT_STATE = {
    isFocused: false,
    isBlurred: false,
    isDirty: false,
    isPristine: true,
};

interface Arguments<T> {
    onFocus?: FocusEventHandler<T>;
    onBlur?: FocusEventHandler<T>;
    onChange?: ChangeEventHandler<T>;
    onPressEnter?: KeyboardEventHandler<T>;
    onKeyDown?: KeyboardEventHandler<T>;
    disabled?: boolean;
}

function useInput<T>(
    { onFocus, onBlur, onChange, onPressEnter, onKeyDown, disabled }: Arguments<T>,
    initialState = DEFAULT_STATE,
    prefix = 'field'
) {
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
            isDirty && DIRTY_CLASS,
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
            onFocus: (event: FocusEvent<T>) => {
                if (disabled) {
                    return;
                }

                if (!isFocused) {
                    changeStatus({
                        ...status,
                        isBlurred: false,
                        isFocused: true,
                        isPristine: false,
                    });
                }

                if (onFocus) {
                    onFocus(event);
                }
            },
            onBlur: (event: FocusEvent<T>) => {
                if (!isBlurred) {
                    changeStatus({
                        ...status,
                        isBlurred: true,
                        isFocused: false,
                        isPristine: false,
                    });
                }

                if (onBlur) {
                    onBlur(event);
                }
            },
            onChange: (event: ChangeEvent<T>) => {
                if (!isDirty) {
                    changeStatus({
                        ...status,
                        isDirty: true,
                        isPristine: false,
                    });
                }

                if (onChange) {
                    onChange(event);
                }
            },
            onKeyDown: (event: KeyboardEvent<T>) => {
                if (event.key === 'Enter' && onPressEnter) {
                    onPressEnter(event);
                }

                if (onKeyDown) {
                    onKeyDown(event);
                }
            },
        },
    };
}

export default useInput;
