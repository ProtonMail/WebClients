import { useRef, useEffect, ChangeEvent } from 'react';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import useActiveShare from '../../hooks/drive/useActiveShare';
import { isTransferCancelError } from '../../utils/transfer';
import { UploadFileList, UploadFileItem } from './interface';
import { useUploadProvider } from './UploadProvider';

const useUploadInput = (forFolders?: boolean) => {
    const { activeFolder } = useActiveShare();
    const { uploadFiles } = useUploadProvider();
    const { createNotification } = useNotifications();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (forFolders && inputRef.current) {
            // React types don't allow `webkitdirectory` but it exists and works
            inputRef.current.setAttribute('webkitdirectory', 'true');
        }
    }, [forFolders]);

    const getItemsToUpload = (files: FileList): UploadFileList => {
        const foldersCreated = new Set<string>();
        const filesToUpload: UploadFileList = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (forFolders) {
                // webkitRelativePath might be available only if property
                // webkitdirectory is set, or not at all. It is important
                // to not use it if its not for folders so at least just
                // files without structure can be uploaded.
                if ('webkitRelativePath' in file) {
                    const path = ((file as any).webkitRelativePath as string).split('/');
                    for (let j = 1; j < path.length; j++) {
                        const folderPath = path.slice(0, j);
                        const folderPathStr = folderPath.join('/');
                        if (!foldersCreated.has(folderPathStr)) {
                            foldersCreated.add(folderPathStr);
                            filesToUpload.push({ path: folderPath.slice(0, -1), folder: folderPath.slice(-1)[0] });
                        }
                    }
                    filesToUpload.push({ path: path.slice(0, -1), file });
                } else {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Your browser does not support uploading folders`,
                    });
                }
            } else {
                filesToUpload.push({ path: [], file });
            }
        }

        return filesToUpload;
    };

    const handleClick = () => {
        if (!activeFolder || !inputRef.current) {
            return;
        }

        inputRef.current.value = '';
        inputRef.current.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!activeFolder || !files) {
            return;
        }

        let filesToUpload = getItemsToUpload(files);
        if (!forFolders) {
            // MacOS has bug, where you can select folders when uploading files in some cases.
            filesToUpload = filesToUpload.filter((item) => !!(item as UploadFileItem).file);
        }

        uploadFiles(activeFolder.shareId, activeFolder.linkId, filesToUpload).catch((err) => {
            if (!isTransferCancelError(err)) {
                console.error(err);
            }
        });
    };

    return { inputRef, handleClick, handleChange };
};

export default useUploadInput;
