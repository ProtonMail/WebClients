import type { ChangeEvent } from 'react';
import { useRef } from 'react';

import { getDrive } from '@proton/drive/index';

import { logError } from '../../utils/errorHandling';

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
    const drive = getDrive();
    const ac = new AbortController();
    let uploadController: any | undefined;

    const done = (async () => {
        try {
            const metadata = {
                mediaType: file.type /* || guessMediaType(file.name) */,
                expectedSize: file.size,
            };

            const fileUploader = await drive.getFileUploader(parentFolderUid, file.name, metadata, ac.signal);
            onChange(UploadingState.Uploading);

            uploadController = await fileUploader.writeFile(
                file,
                [], // TODO: implement thumbnail after POC
                (uploadedBytes: number) => {
                    const pct = Math.min((uploadedBytes / file.size) * 100, 100);
                    onProgress(pct);
                }
            );

            const nodeUid = await uploadController.completion();
            console.log(nodeUid);
            onChange(UploadingState.Finished);
            return nodeUid;
        } catch (e) {
            onChange(UploadingState.Failed);
            logError(e);
            throw e;
        }
    })();

    return {
        pause: () => {
            if (!uploadController) {
                return;
            }
            uploadController.pause();
            onChange(UploadingState.Paused);
        },
        resume: () => {
            if (!uploadController) {
                return;
            }
            uploadController.resume();
        },
        abort: () => ac.abort(),
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
