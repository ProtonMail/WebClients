import { useRef, useEffect, ChangeEvent } from 'react';
import useActiveShare from './useActiveShare';
import { isTransferCancelError } from '../../utils/transfer';
import useFiles from './useFiles';

const useFileUploadInput = (forFolders?: boolean) => {
    const DS_STORE = '.DS_Store';

    const { uploadDriveFiles } = useFiles();
    const { activeFolder } = useActiveShare();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (forFolders && inputRef.current) {
            // React types don't allow `webkitdirectory` but it exists and works
            inputRef.current.setAttribute('webkitdirectory', 'true');
        }
    }, [forFolders]);

    const getFolderItemsToUpload = (files: FileList) => {
        const foldersCreated = new Set<string>();
        const filesToUpload: { path: string[]; file?: File }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Skip 'Desktop Services Store' files.
            if (file.name === DS_STORE) {
                continue;
            }

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

        const filesToUpload = forFolders ? getFolderItemsToUpload(files) : files;
        uploadDriveFiles(activeFolder.shareId, activeFolder.linkId, filesToUpload, !forFolders).catch((err) => {
            if (!isTransferCancelError(err)) {
                console.error(err);
            }
        });
    };

    return { inputRef, handleClick, handleChange };
};

export default useFileUploadInput;
