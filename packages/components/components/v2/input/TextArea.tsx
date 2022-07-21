import { ComponentPropsWithRef, forwardRef, ReactNode, Ref, useEffect, useRef } from 'react';
import { useCombinedRefs } from '../../..';
import { classnames } from '../../../helpers';
import useAutoGrow from '../../../hooks/useAutoGrow';

export interface TextAreaTwoProps extends Omit<ComponentPropsWithRef<'textarea'>, 'prefix'> {
    error?: ReactNode | boolean;
    disableChange?: boolean;
    rows?: number;
    minRows?: number;
    autoGrow?: boolean;
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
        ...rest
    } = props;

    const className = classnames([classNameProp, 'w100 textarea', Boolean(error) && 'error']);
    const { rows, updateTextArea } = useAutoGrow({ maxRows, minRows, autoGrow });

    useEffect(() => {
        if (textAreaRef.current) {
            updateTextArea?.(textAreaRef.current);
        }
    }, [updateTextArea]);

    return (
        <textarea
            aria-invalid={!!error}
            {...rest}
            ref={useCombinedRefs(textAreaRef, ref)}
            onChange={(e) => {
                if (disableChange) {
                    return;
                }
                onValue?.(e.target.value);
                rest.onChange?.(e);
                updateTextArea?.(textAreaRef.current);
            }}
            rows={rows}
            className={className}
        />
    );
};

export default forwardRef<HTMLTextAreaElement, TextAreaTwoProps>(TextAreaTwo);
