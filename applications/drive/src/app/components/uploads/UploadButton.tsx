import React, { useRef, ChangeEvent } from 'react';
import { LargeButton, FloatingButton } from 'react-components';
import { c } from 'ttag';
import { useDriveActiveFolder } from '../Drive/DriveFolderProvider';
import useFiles from '../../hooks/drive/useFiles';

interface Props {
    floating?: boolean;
}

const UploadButton = ({ floating }: Props) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const { folder } = useDriveActiveFolder();
    const { uploadDriveFiles } = useFiles();

    const handleClick = () => {
        if (!folder || !fileInput.current) {
            return;
        }

        fileInput.current.value = '';
        fileInput.current.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;

        if (!folder || !files) {
            return;
        }

        uploadDriveFiles(folder.shareId, folder.linkId, files, true).catch(console.error);
    };

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />

            {floating && folder?.shareId ? (
                <FloatingButton onClick={handleClick} title={c('Action').t`Upload`} icon="plus" />
            ) : (
                <LargeButton
                    className="pm-button--primary ml1 mr1 mt0-25 strong"
                    disabled={!folder?.shareId}
                    onClick={handleClick}
                >{c('Action').t`Upload`}</LargeButton>
            )}
        </>
    );
};

export default UploadButton;
