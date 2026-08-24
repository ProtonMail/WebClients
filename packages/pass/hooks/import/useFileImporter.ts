import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { isAbortError } from '../../lib/api/errors';
import { getImportFilename } from '../../lib/import/helpers/files';
import type { ImportReport } from '../../lib/import/helpers/report';
import type { ImportFileReader } from '../../lib/import/types';
import { fileLinkPending } from '../../store/actions';
import { selectUserStorageMaxFileSize } from '../../store/selectors';
import type { IndexedByShareIdAndItemId, MaybeNull } from '../../types';
import { eq, not } from '../../utils/fp/predicates';
import { abortableSequence } from '../../utils/fp/promises';
import { uniqueId } from '../../utils/string/unique-id';
import type { OnFileUploadProgress } from '../files/useFileUpload';
import { resolveMimeTypeForFile, useFileUpload } from '../files/useFileUpload';
import { useAsyncRequestDispatch } from '../useDispatchAsyncRequest';

export const useFileImporter = () => {
    const dispatch = useAsyncRequestDispatch();
    const fileUpload = useFileUpload();
    const [progress, setProgress] = useState(0);
    const { createNotification } = useNotifications();
    const maxFileSize = useSelector(selectUserStorageMaxFileSize);

    const reset = useCallback(() => setProgress(0), []);

    const cancel = useCallback(() => {
        fileUpload.cancel('*');
        reset();
    }, []);

    const addProgress = useCallback((increment: number) => setProgress((val) => val + increment), []);

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
                                    const filename = getImportFilename(path, report.provider);
                                    let blob = await fileReader.getFile(path);

                                    /** Track remaining progress for error recovery
                                     * Null means we haven't started uploading yet */
                                    let remaining: MaybeNull<number> = null;

                                    /** Only increment when we have actual progress (uploaded > 0)
                                     * Store the remaining portion for error recovery */
                                    const onFileProgress: OnFileUploadProgress = (uploaded, total) => {
                                        remaining = (total - uploaded) / total;
                                        if (uploaded > 0) addProgress(1 / total);
                                    };

                                    if (blob) {
                                        try {
                                            if (blob.size > maxFileSize) {
                                                const maxFileSizeInMB = humanSize({
                                                    bytes: maxFileSize,
                                                    unit: 'MB',
                                                    fraction: 0,
                                                });
                                                return createNotification({
                                                    type: 'error',
                                                    text: c('Pass_file_attachments')
                                                        .t`"${filename}" is too large to upload. The maximum allowed size is (${maxFileSizeInMB})`,
                                                });
                                            }

                                            const mimeType = await resolveMimeTypeForFile(blob);

                                            const fileID = await fileUpload.start(
                                                blob,
                                                filename,
                                                mimeType,
                                                shareId,
                                                uniqueId(),
                                                onFileProgress
                                            );

                                            toAdd.push(fileID);
                                            report.ignoredFiles = report.ignoredFiles?.filter(not(eq(path)));
                                        } catch (error) {
                                            if (isAbortError(error)) throw error;
                                            const detail = error instanceof Error ? `(${error.message})` : '';
                                            createNotification({
                                                type: 'error',
                                                text: `${c('Pass_file_attachments').t`"${filename}" could not be imported.`} ${detail}`,
                                            });
                                        } finally {
                                            blob = null;
                                            /** Handle final progress update in all cases to
                                             * ensure progress reaches 100% even when errors occur :
                                             * - If remaining is null: file was never processed
                                             * - If remaining is not 0: add the remaining portion */
                                            if (remaining === null) addProgress(1);
                                            else if (remaining !== 0) addProgress(remaining);
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

    return { start, cancel, reset, progress };
};
