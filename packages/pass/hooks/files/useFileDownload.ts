import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useCurrentPort, useCurrentTabID, usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { intoFileParam, mimetypeForDownload } from '@proton/pass/lib/file-attachments/helpers';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { getSafeStorage } from '@proton/pass/lib/file-storage/utils';
import browser from '@proton/pass/lib/globals/browser';
import { fileDownload, fileDownloadPublic } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import type {
    FileDescriptor,
    FileDownloadDTO,
    FileForDownload,
    FileID,
    SelectedItem,
    WithTabId,
} from '@proton/pass/types';
import { download } from '@proton/pass/utils/dom/download';
import { prop } from '@proton/pass/utils/fp/lens';
import { abortable } from '@proton/pass/utils/fp/promises';
import { updateSet } from '@proton/pass/utils/fp/state';
import { logId, logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

export const useFileDownload = () => {
    /** Extension specifics */
    const { popup } = usePassCore();
    const tabId = useCurrentTabID();
    const port = useCurrentPort();

    const dispatch = useDispatch();
    const asyncDispatch = useAsyncRequestDispatch();
    const ctrls = useRef<Map<FileID, AbortController>>(new Map());
    const [pending, setPending] = useState(new Set<string>());

    const downloadFile = useCallback(async (res: FileForDownload, descriptor: FileDescriptor): Promise<void> => {
        const mimeType = mimetypeForDownload(descriptor.mimeType);
        const { fileRef, storageType } = res;

        /** Trying to download from the extension popup in safari will
         * cause the filename to be `Unknown`. To alleviate this, leverage
         * the internal file saver page to by-pass this limitation */
        if (BUILD_TARGET === 'safari' && popup && !popup.expanded) {
            const file = intoFileParam({ filename: descriptor.name, mimeType, ref: fileRef });
            const url = browser.runtime.getURL(`internal.html#file/${file}`);
            browser.windows.create({ url, type: 'popup', height: 320, width: 250 }).catch(noop);
            return;
        }

        const fs = getSafeStorage(storageType);
        const file = await fs.readFile(fileRef, mimeType);
        if (file) download(file, descriptor.name);
    }, []);

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
        async (file: FileDescriptor, options: { filesToken: string } | SelectedItem): Promise<void> => {
            const { fileID, encryptionVersion } = file;
            logger.debug(`[File::download::v${encryptionVersion}] downloading ${logId(fileID)}`);

            try {
                const ctrl = new AbortController();
                const { signal } = ctrl;

                ctrls.current.set(file.fileID, ctrl);
                setPending(updateSet((next) => next.add(fileID)));

                const chunkIDs = file.chunks.map(prop('ChunkID'));

                const res = await (() => {
                    if ('filesToken' in options) {
                        const dto = {
                            fileID,
                            chunkIDs,
                            encryptionVersion,
                            storageType: fileStorage.type,
                            ...options,
                        };

                        return abortable(signal)(
                            () => asyncDispatch(fileDownloadPublic, dto),
                            () => dispatch(requestCancel(fileDownloadPublic.requestID(dto)))
                        );
                    }

                    const dto: WithTabId<FileDownloadDTO> = {
                        fileID,
                        chunkIDs,
                        tabId,
                        encryptionVersion,
                        storageType: fileStorage.type,
                        port,
                        ...options,
                    };

                    return abortable(signal)(
                        () => asyncDispatch(fileDownload, dto),
                        () => dispatch(requestCancel(fileDownload.requestID(dto)))
                    );
                })();

                if (res.type === 'success') downloadFile(res.data, file).catch(noop);
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
