import React, { forwardRef, useRef } from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const FileInput = forwardRef(({ children, id = 'fileInput', className, onChange, ...rest }, ref) => {
    const newRef = useRef();
    const fileRef = ref || newRef;

    const handleChange = (e) => {
        onChange(e);
        // Reset it to allow to select the same file again.
        fileRef.current.value = '';
    };

    return (
        <label className={classnames(['pm-button', className])} htmlFor={id}>
            <input id={id} type="file" className="hidden" onChange={handleChange} {...rest} ref={fileRef} />
            {children}
        </label>
    );
});

FileInput.propTypes = {
    children: PropTypes.node.isRequired,
    id: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string
};

export default FileInput;
