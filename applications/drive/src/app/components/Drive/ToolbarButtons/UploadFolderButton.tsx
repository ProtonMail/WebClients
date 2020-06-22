import React, { useRef, ChangeEvent, useEffect } from 'react';
import { ToolbarButton } from 'react-components';
import { c } from 'ttag';
import { DriveFolder } from '../DriveFolderProvider';
import useFiles from '../../../hooks/drive/useFiles';

interface Props {
    activeFolder: DriveFolder;
}

const UploadFolderButton = ({ activeFolder }: Props) => {
    const fileInput = useRef<HTMLInputElement>(null);
    const { uploadDriveFiles } = useFiles();

    useEffect(() => {
        if (fileInput.current) {
            // React types don't allow `webkitdirectory` but it exists and works
            fileInput.current.setAttribute('webkitdirectory', 'true');
        }
    }, []);

    const handleUploadFolder = () => {
        if (!fileInput.current) {
            return;
        }

        fileInput.current.value = '';
        fileInput.current.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (!files) {
            return;
        }

        const foldersCreated = new Set<string>();
        const filesToUpload: { path: string[]; file?: File }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if ('webkitRelativePath' in file) {
                const path = ((file as any).webkitRelativePath as string).split('/');
                for (let j = 1; j < path.length; j++) {
                    const folderPath = path.slice(0, j);
                    const folderPathStr = folderPath.join('/');
                    if (!foldersCreated.has(folderPathStr)) {
                        foldersCreated.add(folderPathStr);
                        filesToUpload.push({ path: folderPath });
                    }
                }
                filesToUpload.push({ path: path.slice(0, -1), file });
            } else {
                console.error('No relative path to determine folder structure from');
            }
        }

        uploadDriveFiles(activeFolder.shareId, activeFolder.linkId, filesToUpload);
    };

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
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
