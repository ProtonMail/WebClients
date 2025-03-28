import { useCallback, useEffect, useState } from 'react';

import { useNotifications } from '@proton/components';
import { useFileUpload } from '@proton/pass/hooks/files/useFileUpload';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { isAbortError } from '@proton/pass/lib/api/errors';
import type { ImportReport } from '@proton/pass/lib/import/helpers/report';
import type { ImportFileReader } from '@proton/pass/lib/import/types';
import { fileLinkPending } from '@proton/pass/store/actions';
import { type IndexedByShareIdAndItemId } from '@proton/pass/types';
import { eq, not } from '@proton/pass/utils/fp/predicates';
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
            files: IndexedByShareIdAndItemId<string[]>,
            report: ImportReport /** Will mutate report in-place */,
            signal: AbortSignal
        ): Promise<void> => {
            for (const shareId in files) {
                for (const itemId in files[shareId]) {
                    const toAdd: string[] = [];
                    try {
                        await abortableSequence(
                            [
                                ...files[shareId][itemId].map((path) => async () => {
                                    /** Filename may include full path inside the
                                     * archive when using the zip reader */
                                    const filename = lastItem(path.split('/'))!;
                                    const blob = await fileReader.getFile(path);
                                    if (blob) {
                                        try {
                                            const file = new File([blob], filename);
                                            const fileID = await fileUpload.start(file, uniqueId());
                                            toAdd.push(fileID);
                                            report.ignoredFiles = report.ignoredFiles?.filter(not(eq(path)));
                                        } catch (err) {
                                            if (isAbortError(err)) throw err;
                                            createNotification({
                                                type: 'error',
                                                text: `"${filename}" could not be imported.`,
                                            });
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
