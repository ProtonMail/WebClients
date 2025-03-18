import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { fileDownloadChunk, fileDownloadPublicChunk } from '@proton/pass/store/actions';
import type {
    FileDescriptor,
    FileDownloadDTO,
    FileDownloadPublicDTO,
    FileID,
    Maybe,
    SelectedItem,
} from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

export const useFileDownload = () => {
    const [downloadedChunks, setDownloadedChunks] = useState(0);
    const dispatch = useAsyncRequestDispatch();
    const abortControllerRef = useRef<Map<FileID, AbortController>>(new Map());
    const [filesDownloading, setFilesDownloading] = useState<FileID[]>([]);

    const downloadFile = useCallback(
        async (file: FileDescriptor, options: { filesToken: string } | SelectedItem): Promise<Maybe<File>> => {
            try {
                setFilesDownloading((f) => f.concat(file.fileID));
                abortControllerRef.current.set(file.fileID, new AbortController());
                const { signal } = abortControllerRef.current.get(file.fileID)!;
                const blobs: Uint8Array[] = [];

                for (let index = 0; index < file.chunks.length; index++) {
                    if (signal.aborted) throw new Error('Download canceled');

                    const chunk = file.chunks[index];
                    const payload = { ...options, fileID: file.fileID, chunkID: chunk.ChunkID };
                    const res =
                        'filesToken' in options
                            ? await dispatch(fileDownloadPublicChunk, payload as FileDownloadPublicDTO)
                            : await dispatch(fileDownloadChunk, payload as FileDownloadDTO);

                    setDownloadedChunks((p) => p + 1);

                    if (res.type === 'success') {
                        const blob = base64StringToUint8Array(res.data);
                        blobs.push(blob);
                    }
                }

                return new File(blobs, file.name, { type: file.mimeType });
            } catch {
            } finally {
                abortControllerRef.current.delete(file.fileID);
                setFilesDownloading((f) => f.filter((id) => id !== file.fileID));
            }
        },
        []
    );

    const cancelDownload = useCallback((fileID: FileID) => {
        abortControllerRef.current.get(fileID)?.abort();
        abortControllerRef.current.delete(fileID);
    }, []);

    const fileToArrayBuffer = useCallback(
        (file: File): Promise<ArrayBuffer> =>
            new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result as ArrayBuffer);
                reader.onerror = () => rej(reader.error);
                reader.readAsArrayBuffer(file);
            }),
        []
    );

    /** Cancel all downloads on unmount and delete the entries from the AbortController Map */
    useEffect(() => () => abortControllerRef.current.forEach((_, fileId) => cancelDownload(fileId)), []);

    return useMemo(
        () => ({ downloadFile, cancelDownload, filesDownloading, fileToArrayBuffer, downloadedChunks }),
        [filesDownloading, downloadedChunks]
    );
};
