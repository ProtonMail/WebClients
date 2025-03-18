import { useState } from 'react';
import { useStore } from 'react-redux';

import { FILE_UNIQUE_ID_LENGTH } from '@proton/pass/constants';
import { useFileDownload } from '@proton/pass/hooks/files/useFileDownload';
import { useFileResolver } from '@proton/pass/hooks/files/useFileResolver';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { flattenFilesByItemShare } from '@proton/pass/lib/file-attachments/helpers';
import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import { selectAllItems } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { FileItemExport } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const useFileExporter = () => {
    const store = useStore<State>();
    const [totalChunks, setTotalChunks] = useState(0);

    const { downloadFile, fileToArrayBuffer, downloadedChunks } = useFileDownload();
    const fileResolver = useStatefulRef(useFileResolver());

    const downloadFiles = async (): Promise<FileItemExport> => {
        const toExport: FileItemExport = {};
        const items = selectAllItems(store.getState());
        const itemsWithAttachments = items.filter(hasAttachments);

        /** Revalidate all files for all items being exported */
        await Promise.all(itemsWithAttachments.map(fileResolver.current));
        /** FIXME: this should account for latest revision files only */
        const fileItems = flattenFilesByItemShare(store.getState().files);

        setTotalChunks(
            fileItems.reduce(
                (totalChunks, { files }) => totalChunks + files.reduce((acc, { chunks }) => acc + chunks.length, 0),
                0
            )
        );

        // Download files sequentially, one-by-one
        for (const { files, ...item } of fileItems) {
            for (const file of files) {
                const fileBlob = await downloadFile(file, item);

                if (!fileBlob) continue;
                const id = uniqueId(FILE_UNIQUE_ID_LENGTH);
                const content = await fileToArrayBuffer(fileBlob);
                const fileToExport = { id, fileName: `${id}-${file.name}`, content, mimeType: file.mimeType };
                const existing = toExport[item.shareId]?.[item.itemId];
                if (existing) existing.push(fileToExport);
                else toExport[item.shareId] = { ...(toExport[item.shareId] ?? {}), [item.itemId]: [fileToExport] };
            }
        }

        return toExport;
    };

    return { downloadFiles, downloadedChunks, totalChunks };
};
