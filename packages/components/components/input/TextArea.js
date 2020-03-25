import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import { generateUID, classnames } from '../../helpers/component';
import useAutoGrow from '../../hooks/useAutoGrow';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

/** @type any **/
const TextArea = (props) => {
    const {
        className = '',
        error,
        rows: maxRows = 5,
        minRows = 1,
        autoGrow = false,
        onChange,
        isSubmitted,
        ...rest
    } = props;
    const textAreaRef = useRef();
    const { rows, updateTextArea } = useAutoGrow({ maxRows, minRows, autoGrow });
    const { handlers, statusClasses, status } = useInput({
        ...props,
        isSubmitted,
        onChange(e) {
            if (updateTextArea) {
                updateTextArea(e.target);
            }
            if (onChange) {
                onChange(e);
            }
        }
    });

    useEffect(() => {
        if (updateTextArea && textAreaRef.current) {
            updateTextArea(textAreaRef.current);
        }
    }, [updateTextArea]);

    const [uid] = useState(generateUID('textarea'));

    const hasError = error && (status.isDirty || isSubmitted);

    return (
        <>
            <textarea
                ref={textAreaRef}
                rows={rows}
                className={classnames(['pm-field w100', className, statusClasses])}
                aria-invalid={hasError}
                aria-describedby={uid}
                {...rest}
                {...handlers}
            />
            <ErrorZone id={uid}>{hasError ? error : ''}</ErrorZone>
        </>
    );
};

TextArea.propTypes = {
    error: PropTypes.string,
    autoGrow: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    id: PropTypes.string,
    onKeyDown: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onPressEnter: PropTypes.func,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    isSubmitted: PropTypes.bool,
    rows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minRows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    textareaRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default TextArea;
