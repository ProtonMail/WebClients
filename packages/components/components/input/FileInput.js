import React from 'react';
import PropTypes from 'prop-types';

const FileInput = ({ children, id, className, ...rest }) => {
    return (
        <label className={'pm-button '.concat(className || '')} htmlFor={id}>
            <input id={id} type="file" className="hidden" {...rest} />
            {children}
        </label>
    );
};

FileInput.propTypes = {
    children: PropTypes.node.isRequired,
    id: PropTypes.string.isRequired,
    className: PropTypes.string
};

FileInput.defaultProps = {
    id: 'fileInput'
};

export default FileInput;
