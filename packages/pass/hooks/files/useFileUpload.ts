import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useCurrentTabID, usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FILE_CHUNK_SIZE, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE } from '@proton/pass/constants';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { PassUIWorkerService } from '@proton/pass/lib/core/ui.worker.service';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { blobToBase64 } from '@proton/pass/lib/file-storage/utils';
import { fileUploadChunk, fileUploadInitiate } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import type { FileChunkUploadDTO, FileID, Maybe, ShareId, TabId, WithTabId } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { abortable, asyncQueue } from '@proton/pass/utils/fp/promises';
import { logId, logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { useFileEncryptionVersion } from './useFileEncryptionVersion';

export type OnFileUploadProgress = (uploaded: number, total: number) => void;

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
    tabId: Maybe<TabId>,
    signal: AbortSignal
): Promise<WithTabId<FileChunkUploadDTO>> => {
    const { blob, chunkIndex, encryptionVersion, fileID, shareId, totalChunks } = options;

    if (EXTENSION_BUILD) {
        switch (fileStorage.type) {
            case 'Memory': {
                const data = await blobToBase64(blob);
                return { chunkIndex, data, encryptionVersion, fileID, shareId, tabId, totalChunks, type: 'b64' };
            }
            default: {
                const ref = `chunk.${uniqueId()}`;
                await fileStorage.writeFile(ref, blob, signal);
                return {
                    chunkIndex,
                    encryptionVersion,
                    fileID,
                    ref,
                    shareId,
                    tabId,
                    totalChunks,
                    type: 'storage',
                    storageType: fileStorage.type,
                };
            }
        }
    }

    return { blob, chunkIndex, encryptionVersion, fileID, shareId, tabId, totalChunks, type: 'blob' };
};

export const useFileUpload = () => {
    const fileEncryptionVersion = useFileEncryptionVersion();
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
                file: File,
                shareId: ShareId,
                uploadID: string,
                onProgress?: OnFileUploadProgress
            ): Promise<FileID> => {
                let fileID: Maybe<string>;
                const encryptionVersion = fileEncryptionVersion.current;
                logger.debug(`[File::upload::v${encryptionVersion}] uploading ${logId(uploadID)}`);

                try {
                    const ctrl = ctrls.current.get(uploadID);
                    if (!ctrl || ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');

                    const { name, size } = file;
                    const totalChunks = Math.ceil(file.size / FILE_CHUNK_SIZE);

                    onProgress?.(0, totalChunks);

                    const mimeType = await (async (): Promise<string> => {
                        try {
                            const mimeTypeBuffer = await file
                                .slice(0, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE)
                                .arrayBuffer();
                            const mimeTypeBufferU8 = new Uint8Array(mimeTypeBuffer);

                            if (BUILD_TARGET === 'safari') {
                                /** Safari's asm.js compilation of `mime_type_from_content` is unstable
                                 * and frequently throws `wasm2js_trap` errors. To prevent this, we
                                 * offload MIME detection to a dedicated WASM worker process instead. */
                                return await PassUIWorkerService.transfer([mimeTypeBufferU8.buffer])(
                                    'mime_type_from_content',
                                    mimeTypeBufferU8
                                );
                            }

                            return PassUI.mime_type_from_content(mimeTypeBufferU8);
                        } catch {
                            /** If the Rust-based MIME detection fails,
                             * use the browser's MIME type detection. */
                            return file.type;
                        }
                    })();

                    const initDTO = {
                        name,
                        mimeType,
                        totalChunks,
                        uploadID,
                        shareId,
                        encryptionVersion,
                    };

                    const init = await abortable(ctrl.signal)(
                        () => asyncDispatch(fileUploadInitiate, initDTO),
                        () => dispatch(requestCancel(fileUploadInitiate.requestID(initDTO)))
                    );

                    if (init.type !== 'success') {
                        if (init.data.aborted) throw new DOMException('User cancelled upload', 'AbortError');
                        throw new Error(init.data.error);
                    }

                    fileID = init.data;

                    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                        const start = chunkIndex * FILE_CHUNK_SIZE;
                        const end = Math.min(start + FILE_CHUNK_SIZE, size);
                        const blob = file.slice(start, end);

                        const dto = await getChunkDTO(
                            { shareId, fileID, chunkIndex, totalChunks, encryptionVersion, blob },
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
        async (file: File, shareId: ShareId, uploadID: string, onProgress?: OnFileUploadProgress): Promise<FileID> => {
            if (file.size === 0) {
                /** On windows electron: when drag'n'dropping a file from an archive
                 * before extraction, the reported file will have a filesize of 0 bytes */
                throw new Error(c('Pass_file_attachments').t`The file you are trying to import is empty`);
            }

            ctrls.current.set(uploadID, new AbortController());
            syncLoadingState();

            return queue(file, shareId, uploadID, onProgress);
        },
        []
    );

    useEffect(() => () => cancel('*'), []);

    return useMemo(() => ({ start, cancel, loading }), [loading]);
};
