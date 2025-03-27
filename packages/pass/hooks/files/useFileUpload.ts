import { useCallback, useEffect, useMemo, useRef } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FILE_CHUNK_SIZE, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE } from '@proton/pass/constants';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import PassCoreUI from '@proton/pass/lib/core/core.ui';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { fileUploadChunk, fileUploadInitiate } from '@proton/pass/store/actions';
import type { FileChunkUploadDTO, FileID, Maybe } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { abortable } from '@proton/pass/utils/fp/promises';

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

    const ctrls = useRef(new Map<string, AbortController>());

    const cancel = useCallback((uploadID: string) => {
        if (uploadID === '*') {
            ctrls.current.forEach((ctrl) => ctrl.abort());
            ctrls.current = new Map();
        } else {
            ctrls.current.get(uploadID)?.abort();
            ctrls.current.delete(uploadID);
        }
    }, []);

    const start = useCallback(async (file: File, uploadID: string): Promise<Maybe<FileID>> => {
        let fileID: Maybe<string>;

        try {
            const ctrl = new AbortController();
            ctrls.current.set(uploadID, ctrl);

            const mimeTypeBuffer = await file.slice(0, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE).arrayBuffer();
            const mimeType = PassCoreUI.mime_type_from_content(new Uint8Array(mimeTypeBuffer));
            const fileSize = file.size;
            const totalChunks = Math.ceil(file.size / FILE_CHUNK_SIZE);

            const res = await dispatch(fileUploadInitiate, { name: file.name, mimeType, totalChunks });

            if (res.type === 'success') {
                fileID = res.data;

                for (let index = 0; index < totalChunks; index++) {
                    const start = index * FILE_CHUNK_SIZE;
                    const end = Math.min(start + FILE_CHUNK_SIZE, fileSize);
                    const blob = file.slice(start, end);
                    const dto = await getChunkDTO(fileID, index, blob);
                    await abortable(() => dispatch(fileUploadChunk, dto), ctrl.signal);
                }

                onTelemetry(TelemetryEventName.PassFileUploaded, {}, { mimeType });
                return fileID;
            }
        } catch (e) {
            throw e;
        } finally {
            if (EXTENSION_BUILD) await fileStorage.deleteFile(`${fileID}.chunk`);
            cancel(uploadID);
        }
    }, []);

    useEffect(() => () => cancel('*'), []);

    return useMemo(() => ({ start, cancel }), []);
};
