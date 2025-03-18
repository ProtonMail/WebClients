import { useCallback, useEffect, useMemo, useState } from 'react';

import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import type { ImportVault } from '@proton/pass/lib/import/types';
import { prop } from '@proton/pass/utils/fp/lens';

export const useFileImporter = () => {
    const { uploadFile, uploadedChunks, calculateTotalChunks, cancelUpload } = useFileUpload();
    const [totalChunks, setTotalChunks] = useState(0);

    const fileProgress = useMemo(
        () => (totalChunks ? Math.round(parseFloat(((uploadedChunks / totalChunks) * 100).toFixed(2))) : 0),
        [uploadedChunks, totalChunks]
    );

    const uploadFiles = useCallback(async (vaults: ImportVault[]): Promise<ImportVault[]> => {
        try {
            const totalFiles = vaults.flatMap(prop('items')).flatMap(prop('files')) as File[];

            setTotalChunks(calculateTotalChunks(totalFiles));

            for (const vault of vaults) {
                for (const item of vault.items) {
                    const fileIds = [];
                    for (const file of item.files as File[]) {
                        const fileID = await uploadFile(file);
                        if (fileID) fileIds.push(fileID);
                    }

                    // TODO: FIXME - Remove this when implementing OPFS
                    item.files = fileIds;
                }
            }
        } catch {
            cancelUpload();
        } finally {
            setTotalChunks(0);
        }

        return vaults;
    }, []);

    useEffect(
        () => () => {
            cancelUpload();
            setTotalChunks(0);
        },
        []
    );

    return { fileProgress, uploadFiles };
};
