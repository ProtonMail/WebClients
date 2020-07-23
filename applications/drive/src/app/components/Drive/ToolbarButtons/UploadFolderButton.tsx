import React from 'react';
import { c } from 'ttag';

import { ToolbarButton } from 'react-components';

import useFileUploadInput from '../../../hooks/drive/useFileUploadInput';

const UploadFolderButton = () => {
    const { inputRef: fileInput, handleClick: handleUploadFolder, handleChange } = useFileUploadInput(true);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-folder"
                icon="folder-upload"
                title={c('Action').t`Upload Folder`}
                onClick={handleUploadFolder}
            />
        </>
    );
};

export default UploadFolderButton;
