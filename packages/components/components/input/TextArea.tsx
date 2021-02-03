import React, { useState, useRef, useEffect, Ref, ChangeEvent } from 'react';

import { generateUID, classnames } from '../../helpers';
import useAutoGrow from '../../hooks/useAutoGrow';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

export interface Props
    extends React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> {
    ref?: Ref<HTMLTextAreaElement>; // override ref so that LegacyRef isn't used
    error?: string;
    isSubmitted?: boolean;
    loading?: boolean;
    rows?: number;
    minRows?: number;
    autoGrow?: boolean;
}
const TextArea = ({
    className = '',
    error,
    rows: maxRows = 5,
    minRows = 1,
    autoGrow = false,
    onChange,
    isSubmitted,
    ...rest
}: Props) => {
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const { rows, updateTextArea } = useAutoGrow({ maxRows, minRows, autoGrow });
    const { handlers, statusClasses, status } = useInput<HTMLTextAreaElement>({
        ...rest,
        onChange(e: ChangeEvent<HTMLTextAreaElement>) {
            if (updateTextArea) {
                updateTextArea(e.target);
            }
            if (onChange) {
                onChange(e);
            }
        },
    });

    useEffect(() => {
        if (updateTextArea && textAreaRef.current) {
            updateTextArea(textAreaRef.current);
        }
    }, [updateTextArea]);

    const [uid] = useState(generateUID('textarea'));

    const hasError = !!(error && (status.isDirty || isSubmitted));

    return (
        <>
            <textarea
                ref={textAreaRef}
                rows={rows}
                className={classnames(['field w100', className, statusClasses])}
                aria-invalid={hasError}
                aria-describedby={uid}
                {...rest}
                {...handlers}
            />
            {hasError && <ErrorZone id={uid}>{error}</ErrorZone>}
        </>
    );
};

export default TextArea;
