import React, { useRef, ChangeEvent } from 'react';
import { useDriveResource } from '../Drive/DriveResourceProvider';
import useFiles from '../../hooks/useFiles';
import { LargeButton } from 'react-components';
import { c } from 'ttag';

const UploadButton = () => {
    const fileInput = useRef<HTMLInputElement>(null);
    const { resource } = useDriveResource();
    const { uploadDriveFiles } = useFiles();

    const handleClick = () => {
        if (!resource || !fileInput.current) {
            return;
        }

        fileInput.current.value = '';
        fileInput.current.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (!resource || !files) {
            return;
        }

        uploadDriveFiles(resource.shareId, resource.linkId, files);
    };

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <LargeButton
                className="pm-button--primary ml1 mr1 mt0-25 strong"
                disabled={!resource?.shareId}
                onClick={handleClick}
            >{c('Action').t`Upload`}</LargeButton>
        </>
    );
};

export default UploadButton;
