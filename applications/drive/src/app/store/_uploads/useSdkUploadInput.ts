import type { ChangeEvent } from 'react';
import { useRef } from 'react';

import type { ProtonDriveClient } from '@proton/drive/index';

import { logError } from '../../utils/errorHandling';
import type {
    OnFileSkippedSuccessCallbackData,
    OnFileUploadSuccessCallbackData,
    // OnFolderUploadSuccessCallbackData,
} from './interface';

enum UploadingState {
    Uploading = 'uploading',
    Failed = 'failed',
    Paused = 'paused',
    PausedServer = 'pausedServer',
    Finished = 'finished',
}

export function useSdkFileUploadInput(
    shareId: string,
    linkId: string,
    isForPhotos: boolean = false,
    drive?: ProtonDriveClient
) {
    return useUploadInput(shareId, linkId, false, isForPhotos, drive);
}

async function uploadFileSdk(
    drive: any,
    parentFolderUid: string,
    file: File,
    onProgress: (pct: number) => void,
    onChange: (status: UploadingState) => void
) {
    let isManuallyPaused = false;
    let isAutomaticallyPaused = false;

    drive.onMessage?.('transfersPaused', () => {
        isAutomaticallyPaused = true;
        onChange(UploadingState.PausedServer);
    });
    drive.onMessage?.('transfersResumed', () => {
        isAutomaticallyPaused = false;
        if (isManuallyPaused) {
            onChange(UploadingState.Paused);
        } else {
            onChange(UploadingState.Uploading);
        }
    });

    const ac = new AbortController();
    let uploadController: any | undefined;

    const uploadInner = async () => {
        // Resolve the destination folder (root if you want "My files")
        const metadata = {
            mediaType: file.type /* || guessMediaType(file.name) */,
            expectedSize: file.size,
        };

        const fileUploader = await drive.getFileUploader(parentFolderUid, file.name, metadata, ac.signal);
        onChange(UploadingState.Uploading);

        uploadController = await fileUploader.writeFile(
            file,
            [], // TODO: how do we expose the generateThumbnails from SDK
            (uploadedBytes: number) => {
                // uploadedBytes is encrypted size; cap at 100
                const pct = Math.min((uploadedBytes / file.size) * 100, 100);
                onProgress(pct);
            }
        );

        await uploadController.completion();
        onChange(UploadingState.Finished);
    };

    void uploadInner().catch((e) => {
        onChange(UploadingState.Failed);
        logError(e);
    });

    return {
        pause: () => {
            if (!uploadController) {
                return;
            }
            uploadController.pause();
            isManuallyPaused = true;
            onChange(UploadingState.Paused);
        },
        resume: () => {
            if (!uploadController) {
                return;
            }
            uploadController.resume();
            isManuallyPaused = false;
            onChange(isAutomaticallyPaused ? UploadingState.PausedServer : UploadingState.Uploading);
        },
        abort: () => ac.abort(),
    };
}

function useUploadInput(shareId: string, linkId: string, forFolders?: boolean, isForPhotos?: boolean, drive?: any) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!shareId || !linkId || !inputRef.current) {
            return;
        }
        inputRef.current.value = '';
        inputRef.current.click();
    };

    const handleChange = async (
        e: ChangeEvent<HTMLInputElement>,
        onFileUpload?: (file: OnFileUploadSuccessCallbackData) => void,
        onFileSkipped?: (file: OnFileSkippedSuccessCallbackData) => void
    ) => {
        const { files } = e.target;
        if (!shareId || !linkId || !files || !drive) {
            return;
        }

        // Normalize inputs and guard against the macOS folder quirk
        let filesToUpload = [...files];
        if (!forFolders) {
            filesToUpload = filesToUpload.filter((item) => item instanceof File);
        }

        // Optionally restrict to photos if needed
        const finalFiles = isForPhotos ? filesToUpload.filter((f) => f.type.startsWith('image/')) : filesToUpload;

        // Upload all in parallel
        await Promise.all(
            finalFiles.map(async (file) => {
                try {
                    const controller = await uploadFileSdk(
                        drive,
                        linkId,
                        file,
                        (pct) => {
                            console.log(`${file.name}: ${pct.toFixed(1)}%`);
                        },
                        (status) => {
                            console.log(`${file.name}: ${status}`);
                        }
                    );

                    //TODO: when should i pass it to the context
                    onFileUpload?.({
                        shareId,
                        fileId: file.name,
                        fileName: file.name,
                    } as unknown as OnFileUploadSuccessCallbackData);

                    return controller;
                } catch (err) {
                    onFileSkipped?.({} as unknown as OnFileSkippedSuccessCallbackData);
                }
            })
        );
    };

    return { inputRef, handleClick, handleChange };
}
