import { ComponentPropsWithRef, ReactNode, Ref, forwardRef, useEffect, useRef } from 'react';

import { useCombinedRefs } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

import useAutoGrow from '../../../hooks/useAutoGrow';

export interface TextAreaTwoProps extends Omit<ComponentPropsWithRef<'textarea'>, 'prefix'> {
    error?: ReactNode | boolean;
    disableChange?: boolean;
    rows?: number;
    minRows?: number;
    autoGrow?: boolean;
    unstyled?: boolean;
    onValue?: (value: string) => void;
}

const TextAreaTwo = (props: TextAreaTwoProps, ref: Ref<HTMLTextAreaElement>) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const {
        error,
        className: classNameProp,
        onValue,
        disableChange,
        rows: maxRows = 5,
        minRows = 1,
        autoGrow = false,
        unstyled,
        value,
        ...rest
    } = props;

    const className = clsx([
        classNameProp,
        'w-full textarea',
        Boolean(unstyled) && 'unstyled',
        Boolean(error) && 'error',
    ]);
    const { rows, updateTextArea } = useAutoGrow({ maxRows, minRows, autoGrow });

    useEffect(() => {
        if (textAreaRef.current) {
            updateTextArea?.(textAreaRef.current);
        }
    }, [updateTextArea, value]);

    return (
        <textarea
            aria-invalid={!!error}
            {...rest}
            value={value}
            ref={useCombinedRefs(textAreaRef, ref)}
            onChange={(e) => {
                if (disableChange) {
                    return;
                }
                onValue?.(e.target.value);
                rest.onChange?.(e);
                if (textAreaRef.current) {
                    updateTextArea?.(textAreaRef.current);
                }
            }}
            rows={rows}
            className={className}
        />
    );
};

export default forwardRef<HTMLTextAreaElement, TextAreaTwoProps>(TextAreaTwo);
