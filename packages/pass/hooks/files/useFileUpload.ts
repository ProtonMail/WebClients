import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { useCurrentTabID, usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FILE_CHUNK_SIZE, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE } from '@proton/pass/constants';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { fileUploadChunk, fileUploadInitiate } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import type { FileChunkUploadDTO, FileID, Maybe, TabId, WithTabId } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { abortable, asyncQueue } from '@proton/pass/utils/fp/promises';

/** In web/desktop, the uploading happens on the same JS context, we can
 * pass blob references around. In the extension, store each chunk to the
 * file storage and pass filename references to the worker.  */
const getChunkDTO = async (
    fileID: string,
    index: number,
    blob: Blob,
    tabId: Maybe<TabId>,
    signal: AbortSignal
): Promise<WithTabId<FileChunkUploadDTO>> => {
    if (EXTENSION_BUILD) {
        const ref = `${fileID}.chunk`;
        await fileStorage.writeFile(ref, blob, signal);
        return { fileID, index, type: 'fs', ref, tabId };
    }

    return { fileID, index, type: 'blob', blob, tabId };
};

export const useFileUpload = () => {
    const tabId = useCurrentTabID();
    const { onTelemetry } = usePassCore();
    const asyncDispatch = useAsyncRequestDispatch();
    const dispatch = useDispatch();

    const ctrls = useRef(new Map<string, AbortController>());

    const cancel = useCallback((uploadID: string) => {
        if (uploadID === '*') {
            ctrls.current.forEach((ctrl) => ctrl.abort('cancelled'));
            ctrls.current = new Map();
        } else {
            ctrls.current.get(uploadID)?.abort();
            ctrls.current.delete(uploadID);
        }
    }, []);

    const queue = useCallback(
        asyncQueue(async (file: File, uploadID: string): Promise<FileID> => {
            let fileID: Maybe<string>;

            try {
                const ctrl = ctrls.current.get(uploadID);
                if (!ctrl || ctrl.signal.aborted) throw new DOMException('Aborted', 'AbortError');

                const { name, size } = file;
                const mimeTypeBuffer = await file.slice(0, FILE_MIME_TYPE_DETECTION_CHUNK_SIZE).arrayBuffer();
                const mimeType = PassUI.mime_type_from_content(new Uint8Array(mimeTypeBuffer));
                const totalChunks = Math.ceil(file.size / FILE_CHUNK_SIZE);
                const initDTO = { name, mimeType, totalChunks, uploadID };

                const init = await abortable(ctrl.signal)(
                    () => asyncDispatch(fileUploadInitiate, initDTO),
                    () => dispatch(requestCancel(fileUploadInitiate.requestID(initDTO)))
                );

                if (init.type !== 'success') {
                    if (init.data.aborted) throw new DOMException('User cancelled upload', 'AbortError');
                    throw new Error(init.data.error);
                }

                fileID = init.data;

                for (let index = 0; index < totalChunks; index++) {
                    const start = index * FILE_CHUNK_SIZE;
                    const end = Math.min(start + FILE_CHUNK_SIZE, size);
                    const blob = file.slice(start, end);
                    const dto = await getChunkDTO(fileID, index, blob, tabId, ctrl.signal);

                    const result = await abortable(ctrl.signal)(
                        () => asyncDispatch(fileUploadChunk, dto),
                        () => dispatch(requestCancel(fileUploadChunk.requestID(dto)))
                    );

                    if (result.type !== 'success') {
                        if (result.data.aborted) throw new DOMException('User cancelled upload', 'AbortError');
                        throw new Error(result.data.error);
                    }
                }

                onTelemetry(TelemetryEventName.PassFileUploaded, {}, { mimeType });
                return fileID;
            } catch (e) {
                throw e;
            } finally {
                if (EXTENSION_BUILD) await fileStorage.deleteFile(`${fileID}.chunk`);
                ctrls.current.delete(uploadID);
            }
        }),
        []
    );

    const start = useCallback(async (file: File, uploadID: string): Promise<FileID> => {
        ctrls.current.set(uploadID, new AbortController());
        return queue(file, uploadID);
    }, []);

    useEffect(() => () => cancel('*'), []);

    return useMemo(() => ({ start, cancel }), []);
};
