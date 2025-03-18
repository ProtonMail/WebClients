import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { FILE_CHUNK_SIZE } from '@proton/pass/constants';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { fileUploadChunk, fileUploadInitiate } from '@proton/pass/store/actions';
import type { FileID, Maybe, MaybeNull } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

export const useFileUpload = () => {
    const [uploadedChunks, setUploadedChunks] = useState(0);
    const { onTelemetry } = usePassCore();
    const dispatch = useAsyncRequestDispatch();
    const abortControllerRef = useRef<MaybeNull<AbortController>>(null);

    const uploadFile = useCallback(async (file: File, chunkSize: number = FILE_CHUNK_SIZE): Promise<Maybe<FileID>> => {
        try {
            abortControllerRef.current = new AbortController();
            const fileSize = file.size;
            const totalChunks = Math.ceil(file.size / chunkSize);
            const res = await dispatch(fileUploadInitiate, { name: file.name, mimeType: file.type, totalChunks });

            if (res.type === 'success') {
                const { signal } = abortControllerRef.current;
                const fileID = res.data;

                for (let index = 0; index < totalChunks; index++) {
                    const start = index * FILE_CHUNK_SIZE;
                    const end = Math.min(start + FILE_CHUNK_SIZE, fileSize);
                    const chunk = await file.slice(start, end).arrayBuffer();

                    await Promise.race([
                        dispatch(fileUploadChunk, { fileID, chunk, index }),
                        new Promise((_, reject) =>
                            signal.addEventListener('abort', () => reject(new Error('Upload cancelled')))
                        ),
                    ]);

                    setUploadedChunks((p) => p + 1);
                }

                onTelemetry(TelemetryEventName.PassFileUploaded, {}, { mimeType: file.type });

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

    const calculateTotalChunks = useCallback(
        (filesMap: File[]): number => filesMap.reduce((acc, file) => acc + Math.ceil(file.size / FILE_CHUNK_SIZE), 0),
        []
    );

    useEffect(() => cancelUpload, []);

    return useMemo(() => ({ uploadedChunks, uploadFile, cancelUpload, calculateTotalChunks }), [uploadedChunks]);
};
