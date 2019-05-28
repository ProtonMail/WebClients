import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const FileInput = forwardRef(({ children, id, className, ...rest }, ref) => {
    return (
        <label className={'pm-button '.concat(className || '')} htmlFor={id}>
            <input id={id} type="file" className="hidden" {...rest} ref={ref} />
            {children}
        </label>
    );
});

FileInput.propTypes = {
    children: PropTypes.node.isRequired,
    id: PropTypes.string.isRequired,
    className: PropTypes.string
};

FileInput.defaultProps = {
    id: 'fileInput'
};

export default FileInput;
