import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { fileDownload, fileDownloadPublic } from '@proton/pass/store/actions';
import type { FileDescriptor, FileID, Maybe, SelectedItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';

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

                if (signal.aborted) throw new Error('Download canceled');
                const chunkIDs = file.chunks.map(prop('ChunkID'));

                const res =
                    'filesToken' in options
                        ? await dispatch(fileDownloadPublic, { fileID: file.fileID, chunkIDs, ...options })
                        : await dispatch(fileDownload, { fileID: file.fileID, chunkIDs, ...options });

                setDownloadedChunks((p) => p + 1); // FIXME: leverage saga
                if (res.type === 'success') return await fileStorage.readFile(res.data);
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
