import { useCallback, useEffect, useState } from 'react';

import { useNotifications } from '@proton/components';
import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { isAbortError } from '@proton/pass/lib/api/errors';
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
    const { createNotification } = useNotifications();

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
            for (const shareId in importFiles) {
                for (const itemId in importFiles[shareId]) {
                    const toAdd: string[] = [];
                    try {
                        await abortableSequence(
                            [
                                ...importFiles[shareId][itemId].map((path) => async () => {
                                    /** Filename may include full path inside the
                                     * archive when using the zip reader */
                                    const filename = lastItem(path.split('/'))!;
                                    const blob = await fileReader.getFile(path);
                                    if (blob) {
                                        try {
                                            const file = new File([blob], filename);
                                            const fileID = await fileUpload.start(file, uniqueId());
                                            if (fileID) toAdd.push(fileID);
                                        } catch (err) {
                                            createNotification({
                                                type: 'error',
                                                text: `"${filename}" could not be imported.`,
                                            });

                                            throw err;
                                        } finally {
                                            setProgress((progress) => progress + 1);
                                        }
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
                    } catch (error) {
                        if (isAbortError(error)) throw error;
                        /** Allow continuation if it's an error for a specific item */
                    }
                }
            }
        },
        []
    );

    useEffect(() => cancel, []);

    return { start, cancel, progress };
};
