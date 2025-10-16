import type { ChangeEvent } from 'react';
import { useRef } from 'react';

import { logError } from '../../utils/errorHandling';
import { uploadManager } from '../../zustand/upload/uploadManager';

enum UploadingState {
    Uploading = 'uploading',
    Failed = 'failed',
    Paused = 'paused',
    PausedServer = 'pausedServer',
    Finished = 'finished',
}

export function useSdkFileUploadInput(nodeUid: string) {
    return useUploadInput(nodeUid);
}

async function uploadFileSdk(
    parentFolderUid: string,
    file: File,
    onProgress: (pct: number) => void,
    onChange: (status: UploadingState) => void
) {
    const done = (async () => {
        try {
            await uploadManager.uploadFiles([file], parentFolderUid);
            onChange(UploadingState.Finished);
        } catch (e) {
            onChange(UploadingState.Failed);
            logError(e);
            throw e;
        }
    })();

    return {
        completion: () => done,
    };
}

function useUploadInput(parentNodeUid: string) {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleClick = () => {
        if (!parentNodeUid || !inputRef.current) {
            return;
        }
        inputRef.current.value = '';
        inputRef.current.click();
    };

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!parentNodeUid || !files) {
            return;
        }
        for (const file of Array.from(files)) {
            try {
                const controller = await uploadFileSdk(
                    parentNodeUid,
                    file,
                    (pct) => {
                        console.log(`${file.name}: ${pct.toFixed(1)}%`);
                    },
                    (status) => {
                        console.log(`${file.name}: ${status}`);
                    }
                );
                await controller.completion();
            } catch (err) {
                console.log('Upload failed:', err);
                logError(err);
            }
        }
    };

    return { inputRef, handleClick, handleChange };
}
