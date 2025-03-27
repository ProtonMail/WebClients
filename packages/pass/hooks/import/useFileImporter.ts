import { useCallback, useEffect, useState } from 'react';

import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import type { ImportFileReader } from '@proton/pass/lib/import/types';
import { fileLinkPending } from '@proton/pass/store/actions';
import { type IndexedByShareIdAndItemId } from '@proton/pass/types';
import { abortableSequence } from '@proton/pass/utils/fp/promises';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import lastItem from '@proton/utils/lastItem';

export const useFileImporter = () => {
    const dispatch = useAsyncRequestDispatch();
    const fileUpload = useFileUpload();
    const [progress, setProgress] = useState(0);

    const cancel = useCallback(() => {
        fileUpload.cancel('*');
        setProgress(0);
    }, []);

    const start = useCallback(
        async (
            fileReader: ImportFileReader,
            importFiles: IndexedByShareIdAndItemId<string[]>,
            signal: AbortSignal
        ): Promise<void> => {
            try {
                for (const shareId in importFiles) {
                    for (const itemId in importFiles[shareId]) {
                        const toAdd: string[] = [];

                        await abortableSequence(
                            [
                                ...importFiles[shareId][itemId].map((filename) => async () => {
                                    const blob = await fileReader.getFile(filename);
                                    if (blob) {
                                        /** Filename may include full path inside the
                                         * archive when using the zip reader */
                                        const name = lastItem(filename.split('/'))!;
                                        const file = new File([blob], name);
                                        const fileID = await fileUpload.start(file, uniqueId());
                                        if (fileID) toAdd.push(fileID);
                                        setProgress((progress) => progress + 1);
                                    }
                                }),
                                () =>
                                    dispatch(fileLinkPending, {
                                        shareId,
                                        itemId,
                                        files: { toAdd, toRemove: [] },
                                    }),
                            ],
                            signal
                        );
                    }
                }
            } catch {
            } finally {
                fileUpload.cancel('*');
            }
        },
        []
    );

    useEffect(() => cancel, []);

    return { start, cancel, progress };
};
