import React from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';
import { getClasses } from '../../helpers/component';

const TextArea = (props) => {
    const handleKeyDown = (event) => {
        const { onPressEnter, onKeyDown } = props;
        const key = keycode(event);

        if (key === 'enter' && onPressEnter) {
            onPressEnter(event);
        }

        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    const {
        className,
        disabled,
        id,
        name,
        onBlur,
        onChange,
        onFocus,
        placeholder,
        rows,
        textareaRef,
        ...rest
    } = props;


    return (
        <textarea
            className={getClasses('pm-field w100', className)}
            disabled={disabled}
            id={id}
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            onFocus={onFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={textareaRef}
            rows={rows}
            {...rest}
            />
    );
};

TextArea.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    id: PropTypes.string,
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
    rows: 5
};

export default TextArea;