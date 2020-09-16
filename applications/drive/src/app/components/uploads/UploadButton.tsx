import React from 'react';
import { c } from 'ttag';

import { FloatingButton, SidebarPrimaryButton } from 'react-components';

import { useDriveActiveFolder } from '../Drive/DriveFolderProvider';
import useFileUploadInput from '../../hooks/drive/useFileUploadInput';

interface Props {
    floating?: boolean;
}

const UploadButton = ({ floating }: Props) => {
    const { folder } = useDriveActiveFolder();
    const { inputRef: fileInput, handleClick, handleChange: handleFileChange } = useFileUploadInput();

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            {floating ? (
                <FloatingButton
                    disabled={!folder?.shareId}
                    onClick={handleClick}
                    title={c('Action').t`New upload`}
                    icon="plus"
                />
            ) : (
                <SidebarPrimaryButton disabled={!folder?.shareId} onClick={handleClick}>{c('Action')
                    .t`New upload`}</SidebarPrimaryButton>
            )}
        </>
    );
};

export default UploadButton;
