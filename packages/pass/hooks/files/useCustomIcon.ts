import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useCurrentPort, useCurrentTabID } from '@proton/pass/components/Core/PassCoreProvider';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { useMemoSelector } from '@proton/pass/hooks/useMemoSelector';
import { isCustomIconFile } from '@proton/pass/lib/file-attachments/custom-icon';
import { mimetypeForDownload } from '@proton/pass/lib/file-attachments/helpers';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { getSafeStorage } from '@proton/pass/lib/file-storage/utils';
import { fileDownload } from '@proton/pass/store/actions';
import { requestCancel } from '@proton/pass/store/request/actions';
import { selectItemFilesForRevision } from '@proton/pass/store/selectors/files';
import type { FileDescriptor, Maybe } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { abortable } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

type UseCustomIconResult = { iconSrc: Maybe<string>; loading: boolean };

/** Finds and downloads a custom icon file attachment for an item,
 * returning an object URL suitable for use in an <img> tag. */
export const useCustomIcon = (options: {
    shareId: string;
    itemId: string;
    revision: number;
}): UseCustomIconResult => {
    const { shareId, itemId, revision } = options;
    const tabId = useCurrentTabID();
    const port = useCurrentPort();
    const dispatch = useDispatch();
    const asyncDispatch = useAsyncRequestDispatch();

    const [iconSrc, setIconSrc] = useState<Maybe<string>>();
    const [loading, setLoading] = useState(false);
    const objectUrlRef = useRef<string>();
    const ctrlRef = useRef<AbortController>();

    const filesForRevision = useMemoSelector(selectItemFilesForRevision, [shareId, itemId, revision]);
    const iconFile: Maybe<FileDescriptor> = filesForRevision.find((f) => isCustomIconFile(f.name));

    const downloadIcon = useCallback(
        async (file: FileDescriptor) => {
            ctrlRef.current?.abort();
            const ctrl = new AbortController();
            ctrlRef.current = ctrl;

            setLoading(true);

            try {
                const { fileID, encryptionVersion } = file;
                const chunkIDs = file.chunks.map(prop('ChunkID'));

                const dto = {
                    fileID,
                    chunkIDs,
                    tabId,
                    encryptionVersion,
                    storageType: fileStorage.type,
                    port,
                    shareId,
                    itemId,
                };

                const res = await abortable(ctrl.signal)(
                    () => asyncDispatch(fileDownload, dto),
                    () => dispatch(requestCancel(fileDownload.requestID(dto)))
                );

                if (res.type === 'success') {
                    const mimeType = mimetypeForDownload(file.mimeType);
                    const { fileRef, storageType } = res.data;
                    const fs = getSafeStorage(storageType);
                    const blob = await fs.readFile(fileRef, mimeType);

                    if (blob) {
                        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
                        const url = URL.createObjectURL(blob);
                        objectUrlRef.current = url;
                        setIconSrc(url);
                    }
                }
            } catch {
                /* download aborted or failed — keep previous state */
            } finally {
                setLoading(false);
            }
        },
        [shareId, itemId, tabId, port]
    );

    useEffect(() => {
        if (iconFile) {
            downloadIcon(iconFile).catch(noop);
        } else {
            setIconSrc(undefined);
        }
    }, [iconFile?.fileID]);

    useEffect(
        () => () => {
            ctrlRef.current?.abort();
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        },
        []
    );

    return { iconSrc, loading };
};
