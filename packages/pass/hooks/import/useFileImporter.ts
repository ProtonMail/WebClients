import { useCallback, useEffect, useState } from 'react';

import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import type { ImportFileReader } from '@proton/pass/lib/import/types';
import { fileLinkPending } from '@proton/pass/store/actions';
import type { IndexedByShareIdAndItemId } from '@proton/pass/types';
import lastItem from '@proton/utils/lastItem';
import noop from '@proton/utils/noop';

export const useFileImporter = () => {
    const dispatch = useAsyncRequestDispatch();
    const { uploadFile, cancelUpload } = useFileUpload();
    const [progress, setProgress] = useState(0);

    const start = useCallback(
        async (fileReader: ImportFileReader, importFiles: IndexedByShareIdAndItemId<string[]>): Promise<void> => {
            try {
                for (const shareId in importFiles) {
                    for (const itemId in importFiles[shareId]) {
                        const toAdd: string[] = [];
                        for (const filename of importFiles[shareId][itemId]) {
                            const blob = await fileReader.getFile(filename);
                            if (blob) {
                                /** Filename may include full path inside the
                                 * archive when using the zip reader */
                                const name = lastItem(filename.split('/'))!;
                                const file = new File([blob], name);
                                const fileID = await uploadFile(file).catch(noop);
                                if (fileID) toAdd.push(fileID);
                                setProgress((progress) => progress + 1);
                            }
                        }

                        await dispatch(fileLinkPending, { shareId, itemId, files: { toAdd, toRemove: [] } });
                    }
                }
            } catch {
                cancelUpload();
            } finally {
                setProgress(0);
            }
        },
        []
    );

    useEffect(
        () => () => {
            cancelUpload();
            setProgress(0);
        },
        []
    );

    return { start, progress };
};
