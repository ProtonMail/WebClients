import React from 'react';
import { c } from 'ttag';
import { ToolbarButton } from 'react-components';
import useFileUploadInput from '../../../hooks/drive/useFileUploadInput';

const UploadFileButton = () => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput();

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-file"
                icon="file-upload"
                title={c('Action').t`Upload File`}
                onClick={handleClick}
            />
        </>
    );
};

export default UploadFileButton;
