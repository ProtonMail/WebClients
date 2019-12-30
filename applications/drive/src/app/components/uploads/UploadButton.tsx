import React, { useRef, ChangeEvent } from 'react';
import { useDriveResource } from '../DriveResourceProvider';
import useFiles from '../../hooks/useFiles';
import { LargeButton } from 'react-components';
import { c } from 'ttag';

const UploadButton = () => {
    const fileInput = useRef<HTMLInputElement>(null);
    const { resource } = useDriveResource();
    const { uploadDriveFile } = useFiles(resource?.shareId ?? '');

    const handleClick = () => {
        if (!resource || !fileInput.current) {
            return;
        }

        fileInput.current.value = '';

        fileInput.current.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!resource || !file) {
            return;
        }

        uploadDriveFile(resource.linkId, file);
    };

    return (
        <>
            <input type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <LargeButton
                className="pm-button--primary ml1 mr1 mt0-25 strong"
                disabled={!resource?.shareId}
                onClick={handleClick}
            >{c('Action').t`Upload`}</LargeButton>
        </>
    );
};

export default UploadButton;
