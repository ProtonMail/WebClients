import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useAutoGrow from '../../hooks/useAutoGrow';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

const TextArea = (props) => {
    const { className = '', error, rows: maxRows = 5, minRows = 1, autoGrow = false, onChange, ...rest } = props;
    const { rows, updateTextArea } = useAutoGrow({ maxRows, minRows, autoGrow });
    const { handlers, statusClasses, status } = useInput({
        ...props,
        onChange(e) {
            if (updateTextArea) {
                updateTextArea(e);
            }
            if (onChange) {
                onChange(e);
            }
        }
    });
    const [uid] = useState(generateUID('textarea'));

    return (
        <>
            <textarea
                rows={rows}
                className={`pm-field w100 ${className} ${statusClasses}`}
                aria-invalid={error && status.isDirty}
                aria-describedby={uid}
                {...rest}
                {...handlers}
            />
            <ErrorZone id={uid}>{error && status.isDirty ? error : ''}</ErrorZone>
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
    rows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minRows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    textareaRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default TextArea;
