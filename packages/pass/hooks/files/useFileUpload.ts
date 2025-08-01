import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useCurrentTabID, usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FILE_CHUNK_SIZE, FILE_ENCRYPTION_VERSION, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE } from '@proton/pass/constants';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { sanitizeFileName } from '@proton/pass/lib/file-attachments/helpers';
import { blobToBase64, getSafeStorage } from '@proton/pass/lib/file-storage/utils';
import { fileUploadChunk, fileUploadInitiate } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import type { FileChunkUploadDTO, FileID, Maybe, ShareId, TabId, WithTabId } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { abortable, asyncQueue } from '@proton/pass/utils/fp/promises';
import { logId, logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export type OnFileUploadProgress = (uploaded: number, total: number) => void;

export const resolveMimeTypeForFile = async (file: Blob) => {
    try {
        const mimeTypeBuffer = await file.slice(0, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE).arrayBuffer();
        return await PassUI.mime_type_from_content(new Uint8Array(mimeTypeBuffer));
    } catch {
        /** If the Rust-based MIME detection fails,
         * use the browser's MIME type detection. */
        return file.type;
    }
};

/** In web/desktop, the uploading happens on the same JS context, we can
 * pass blob references around. In the extension, store each chunk to the
 * file storage and pass filename references to the worker.  */
const getChunkDTO = async (
    options: {
        blob: Blob;
        chunkIndex: number;
        encryptionVersion: number;
        fileID: FileID;
        shareId: ShareId;
        totalChunks: number;
    },
    storageType: string,
    tabId: Maybe<TabId>,
    signal: AbortSignal
): Promise<WithTabId<FileChunkUploadDTO>> => {
    const { blob, chunkIndex, encryptionVersion, fileID, shareId, totalChunks } = options;

    if (EXTENSION_BUILD) {
        const fs = getSafeStorage(storageType);

        switch (fs.type) {
            case 'Memory': {
                const data = await blobToBase64(blob);
                return { chunkIndex, data, encryptionVersion, fileID, shareId, tabId, totalChunks, type: 'b64' };
            }
            default: {
                const ref = `chunk.${uniqueId()}`;
                await fs.writeFile(ref, blob, signal);
                return {
                    chunkIndex,
                    encryptionVersion,
                    fileID,
                    ref,
                    shareId,
                    tabId,
                    totalChunks,
                    type: 'storage',
                    storageType: fs.type,
                };
            }
        }
    }

    return { blob, chunkIndex, encryptionVersion, fileID, shareId, tabId, totalChunks, type: 'blob' };
};

export const useFileUpload = () => {
    const tabId = useCurrentTabID();

    const { onTelemetry } = usePassCore();
    const asyncDispatch = useAsyncRequestDispatch();
    const dispatch = useDispatch();

    const ctrls = useRef(new Map<string, AbortController>());
    const [loading, setLoading] = useState(false);

    const syncLoadingState = useCallback(() => setLoading(ctrls.current.size > 0), []);

    const cancel = useCallback((uploadID: string) => {
        if (uploadID === '*') {
            ctrls.current.forEach((ctrl) => ctrl.abort('cancelled'));
            ctrls.current = new Map();
        } else {
            ctrls.current.get(uploadID)?.abort();
            ctrls.current.delete(uploadID);
        }

        syncLoadingState();
    }, []);

    const queue = useCallback(
        asyncQueue(
            async (
                file: Blob,
                name: string,
                mimeType: string,
                shareId: ShareId,
                uploadID: string,
                onProgress?: OnFileUploadProgress
            ): Promise<FileID> => {
                let fileID: Maybe<string>;
                logger.debug(`[File::upload::v${FILE_ENCRYPTION_VERSION}] uploading ${logId(uploadID)}`);

                try {
                    const ctrl = ctrls.current.get(uploadID);
                    if (!ctrl || ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');

                    const { size } = file;
                    const totalChunks = Math.ceil(file.size / FILE_CHUNK_SIZE);

                    onProgress?.(0, totalChunks);

                    const initDTO = {
                        name: sanitizeFileName(name),
                        mimeType,
                        totalChunks,
                        uploadID,
                        shareId,
                        encryptionVersion: FILE_ENCRYPTION_VERSION,
                    };

                    const init = await abortable(ctrl.signal)(
                        () => asyncDispatch(fileUploadInitiate, initDTO),
                        () => dispatch(requestCancel(fileUploadInitiate.requestID(initDTO)))
                    );

                    if (init.type !== 'success') {
                        if (init.data.aborted) throw new DOMException('User cancelled upload', 'AbortError');
                        throw new Error(init.data.error);
                    }

                    fileID = init.data.fileID;

                    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                        const start = chunkIndex * FILE_CHUNK_SIZE;
                        const end = Math.min(start + FILE_CHUNK_SIZE, size);
                        const blob = file.slice(start, end);

                        const dto = await getChunkDTO(
                            {
                                shareId,
                                fileID,
                                chunkIndex,
                                totalChunks,
                                encryptionVersion: FILE_ENCRYPTION_VERSION,
                                blob,
                            },
                            init.data.storageType,
                            tabId,
                            ctrl.signal
                        );

                        const result = await abortable(ctrl.signal)(
                            () => asyncDispatch(fileUploadChunk, dto),
                            () => dispatch(requestCancel(fileUploadChunk.requestID(dto)))
                        );

                        if (result.type !== 'success') {
                            if (result.data.aborted) throw new DOMException('User cancelled upload', 'AbortError');
                            throw new Error(result.data.error);
                        }

                        onProgress?.(chunkIndex + 1, totalChunks);
                    }

                    onTelemetry(TelemetryEventName.PassFileUploaded, {}, { mimeType });
                    return fileID;
                } catch (e) {
                    throw e;
                } finally {
                    ctrls.current.delete(uploadID);
                    syncLoadingState();
                }
            }
        ),
        []
    );

    const start = useCallback(
        (
            file: Blob,
            name: string,
            mimeType: string,
            shareId: ShareId,
            uploadID: string,
            onProgress?: OnFileUploadProgress
        ): Promise<FileID> => {
            if (file.size === 0) {
                /** On windows electron: when drag'n'dropping a file from an archive
                 * before extraction, the reported file will have a filesize of 0 bytes */
                throw new Error(c('Pass_file_attachments').t`The file you are trying to import is empty`);
            }

            ctrls.current.set(uploadID, new AbortController());
            syncLoadingState();

            return queue(file, name, mimeType, shareId, uploadID, onProgress);
        },
        []
    );

    useEffect(() => () => cancel('*'), []);

    return useMemo(() => ({ start, cancel, loading }), [loading]);
};
