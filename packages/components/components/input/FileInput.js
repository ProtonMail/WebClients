import React, { forwardRef, useRef } from 'react';
import PropTypes from 'prop-types';

const FileInput = forwardRef(({ children, id, className, onChange, ...rest }, ref) => {
    const newRef = useRef();
    const fileRef = ref || newRef;

    const handleChange = (e) => {
        onChange(e);
        // Reset it to allow to select the same file again.
        fileRef.current.value = '';
    };

    return (
        <label className={'pm-button '.concat(className || '')} htmlFor={id}>
            <input id={id} type="file" className="hidden" onChange={handleChange} {...rest} ref={fileRef} />
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
