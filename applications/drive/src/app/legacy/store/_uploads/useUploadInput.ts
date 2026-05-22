import type { ChangeEvent } from 'react';
import { useEffect, useRef } from 'react';

import { generateNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';

export function useFileUploadInput(volumeId: string, shareId: string, linkId: string, isForPhotos: boolean = false) {
    return useUploadInput(volumeId, shareId, linkId, false, isForPhotos);
}

export function useFolderUploadInput(volumeId: string, shareId: string, linkId: string, isForPhotos: boolean = false) {
    return useUploadInput(volumeId, shareId, linkId, true, isForPhotos);
}

function useUploadInput(
    volumeId: string,
    shareId: string,
    linkId: string,
    forFolders?: boolean,
    isForPhotos?: boolean
) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (forFolders && inputRef.current) {
            // React types don't allow `webkitdirectory` but it exists and works
            inputRef.current.setAttribute('webkitdirectory', 'true');
        }
    }, [forFolders]);

    const handleClick = () => {
        if (!shareId || !linkId || !inputRef.current) {
            return;
        }

        inputRef.current.value = '';
        inputRef.current.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!shareId || !linkId || !files) {
            return;
        }

        const parentUid = generateNodeUid(volumeId, linkId);
        return isForPhotos ? uploadManager.uploadPhotos(files) : uploadManager.upload(files, parentUid);
    };

    return { inputRef, handleClick, handleChange };
}
