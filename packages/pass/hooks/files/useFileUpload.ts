import { useCallback, useEffect, useMemo, useRef } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FILE_CHUNK_SIZE, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE } from '@proton/pass/constants';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import PassCoreUI from '@proton/pass/lib/core/core.ui';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { fileUploadChunk, fileUploadInitiate } from '@proton/pass/store/actions';
import type { FileChunkUploadDTO, FileID, Maybe, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

/** In web/desktop, the uploading happens on the same JS context, we can
 * pass blob references around. In the extension, store each chunk to the
 * file storage and pass filename references to the worker.  */
const getChunkDTO = async (fileID: string, index: number, blob: Blob): Promise<FileChunkUploadDTO> => {
    if (EXTENSION_BUILD) {
        const ref = `${fileID}.chunk`;
        await fileStorage.writeFile(ref, blob);
        return { fileID, index, type: 'fs', ref };
    }

    return { fileID, index, type: 'blob', blob };
};

export const useFileUpload = () => {
    const { onTelemetry } = usePassCore();
    const dispatch = useAsyncRequestDispatch();
    const abortControllerRef = useRef<MaybeNull<AbortController>>(null);

    const uploadFile = useCallback(async (file: File, chunkSize: number = FILE_CHUNK_SIZE): Promise<Maybe<FileID>> => {
        try {
            const mimeTypeBuffer = await file.slice(0, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE).arrayBuffer();
            const mimeType = PassCoreUI.mime_type_from_content(new Uint8Array(mimeTypeBuffer));

            const fileSize = file.size;
            const totalChunks = Math.ceil(file.size / chunkSize);

            const res = await dispatch(fileUploadInitiate, { name: file.name, mimeType, totalChunks });

            if (res.type === 'success') {
                abortControllerRef.current = new AbortController();
                const { signal } = abortControllerRef.current;

                const fileID = res.data;

                for (let index = 0; index < totalChunks; index++) {
                    const start = index * FILE_CHUNK_SIZE;
                    const end = Math.min(start + FILE_CHUNK_SIZE, fileSize);
                    const blob = file.slice(start, end);
                    const dto = await getChunkDTO(fileID, index, blob);

                    await Promise.race([
                        dispatch(fileUploadChunk, dto),
                        new Promise((_, reject) =>
                            signal.addEventListener('abort', () => reject(new Error('Upload cancelled')))
                        ),
                    ]);
                }

                onTelemetry(TelemetryEventName.PassFileUploaded, {}, { mimeType });

                if (EXTENSION_BUILD) await fileStorage.deleteFile(`${fileID}.chunk`);
                return fileID;
            }
        } catch (e) {
            throw e;
        } finally {
            abortControllerRef.current = null;
        }
    }, []);

    const cancelUpload = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    useEffect(() => cancelUpload, []);

    return useMemo(() => ({ uploadFile, cancelUpload }), []);
};
