import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

const TextArea = (props) => {
    const { className, error, ...rest } = props;
    const { handlers, statusClasses, status } = useInput(props);
    const [uid] = useState(generateUID('textarea'));
    return (
        <>
            <textarea
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
    textareaRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

TextArea.defaultProps = {
    rows: 5,
    className: ''
};

export default TextArea;
