import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { fileDownload, fileDownloadPublic } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import type { FileDescriptor, FileID, Maybe, SelectedItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { abortable } from '@proton/pass/utils/fp/promises';
import { updateSet } from '@proton/pass/utils/fp/state';

export const useFileDownload = () => {
    const dispatch = useDispatch();
    const asyncDispatch = useAsyncRequestDispatch();
    const ctrls = useRef<Map<FileID, AbortController>>(new Map());
    const [pending, setPending] = useState(new Set<string>());

    const cancel = useCallback((fileID: string) => {
        if (fileID === '*') {
            ctrls.current.forEach((ctrl) => ctrl.abort());
            ctrls.current = new Map();
        } else {
            ctrls.current.get(fileID)?.abort();
            ctrls.current.delete(fileID);
        }
    }, []);

    const start = useCallback(
        async (file: FileDescriptor, options: { filesToken: string } | SelectedItem): Promise<Maybe<File>> => {
            const { fileID } = file;

            try {
                const ctrl = new AbortController();
                ctrls.current.set(file.fileID, ctrl);
                setPending(updateSet((next) => next.add(fileID)));

                const chunkIDs = file.chunks.map(prop('ChunkID'));

                const res = await (() => {
                    if ('filesToken' in options) {
                        const dto = { fileID, chunkIDs, ...options };
                        const job = () => asyncDispatch(fileDownloadPublic, dto);
                        const onAbort = () => dispatch(requestCancel(fileDownloadPublic.requestID(dto)));
                        return abortable(job, ctrl.signal, onAbort);
                    }

                    const dto = { fileID, chunkIDs, ...options };
                    const job = () => asyncDispatch(fileDownload, dto);
                    const onAbort = () => dispatch(requestCancel(fileDownload.requestID(dto)));
                    return abortable(job, ctrl.signal, onAbort);
                })();

                if (res.type === 'success') return await abortable(() => fileStorage.readFile(res.data), ctrl.signal);
            } catch {
            } finally {
                ctrls.current.delete(fileID);
                setPending(updateSet((next) => next.delete(file.fileID)));
            }
        },
        []
    );

    useEffect(() => () => cancel('*'), []);

    return useMemo(() => ({ start, cancel, pending }), [pending]);
};
