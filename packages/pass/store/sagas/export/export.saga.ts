import type { Channel, Task } from 'redux-saga';
import { channel } from 'redux-saga';
import { cancelled, fork, put, select, take } from 'redux-saga/effects';

import type { ExportGenerator } from '@proton/pass/lib/export/archive';
import {
    createArchive,
    createExportAttachmentsStream,
    createExportDataStream,
    getArchiveName,
} from '@proton/pass/lib/export/archive';
import { createPassExportCSV } from '@proton/pass/lib/export/csv';
import { ExportFormat } from '@proton/pass/lib/export/types';
import { fileStorage } from '@proton/pass/lib/file-storage/fs';
import { hasAttachments, itemEq } from '@proton/pass/lib/items/item.predicates';
import { exportData } from '@proton/pass/store/actions/creators/transfer';
import { requestProgress } from '@proton/pass/store/request/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import type { ExportThunk } from '@proton/pass/store/selectors';
import { selectAllItems, selectExportData } from '@proton/pass/store/selectors';
import type {
    FileDescriptor,
    IndexedByShareIdAndItemId,
    ItemRevision,
    MaybeNull,
    SelectedItem,
} from '@proton/pass/types';

type ExportFileProgress = { totalItems: number; itemFilesCount: number } & SelectedItem;

/* Tracks export progress by calculating completion percentage. We don't
 * know file counts per item upfront, so we maintain state of the current
 * item being processed, track processed items and files, then calculate
 * total progress as finished items plus partial completion of current item
 * before dispatching percentage updates. */
function* progressWorker(channel: Channel<ExportFileProgress>) {
    let currentItem: MaybeNull<SelectedItem> = null;
    let processedItems = 0;
    let processedFiles = 0;

    while (true) {
        const event: ExportFileProgress = yield take(channel);
        const { totalItems, itemFilesCount, shareId, itemId } = event;

        if (currentItem && itemEq(currentItem)(event)) processedFiles++;
        else {
            currentItem = { shareId, itemId };
            processedFiles = 1;
        }

        if (processedFiles >= itemFilesCount) {
            processedItems++;
            currentItem = null;
        }

        const base = (processedItems / totalItems) * 100;
        const remaining = currentItem ? (processedFiles / itemFilesCount) * (100 / totalItems) : 0;
        const progress = Math.ceil(base + remaining);

        yield put(requestProgress(exportData.requestID(), progress));
    }
}

type ExportState = {
    stream?: ReadableStream;
    filename?: string;
    controller?: AbortController;
};

export const exportUserData = createRequestSaga({
    actions: exportData,
    call: function* ({ fileAttachments, format, passphrase }, { getConfig }) {
        const state: ExportState = {};

        try {
            const files: IndexedByShareIdAndItemId<FileDescriptor[]> = {};
            const iterators: ExportGenerator[] = [];
            const config = getConfig();

            const progressChannel = channel<ExportFileProgress>();
            const progressTask: Task = yield fork(progressWorker, progressChannel);

            /** The files object is populated as a side effect when the files stream
             * is consumed during ZIP creation. We intentionally add the JSON export
             * iterator second because it needs the completed `files` reference to properly
             * include file attachments in the export metadata. This ordering ensures
             * all file data is available when the JSON is generated. */
            const exportThunk: ExportThunk = yield select(selectExportData(config));

            if (fileAttachments && format !== ExportFormat.CSV) {
                const items: ItemRevision[] = yield select(selectAllItems);
                const itemsWithAttachments = items.filter(hasAttachments);
                const totalItems = itemsWithAttachments.length;

                iterators.push(
                    createExportAttachmentsStream(itemsWithAttachments, (file, { shareId, itemId }, itemFilesCount) => {
                        files[shareId] = files[shareId] ?? {};
                        files[shareId][itemId] = files[shareId][itemId] ?? [];
                        files[shareId][itemId].push(file);
                        progressChannel.put({ totalItems, itemFilesCount, shareId, itemId });
                    })
                );
            }

            switch (format) {
                case ExportFormat.CSV: {
                    state.filename = getArchiveName('csv');
                    const blob: Blob = yield createPassExportCSV(exportThunk({}));
                    yield fileStorage.writeFile(state.filename, blob);
                    break;
                }
                case ExportFormat.ZIP:
                case ExportFormat.PGP: {
                    state.filename = getArchiveName('zip');
                    state.controller = new AbortController();

                    iterators.push(
                        createExportDataStream(exportThunk, {
                            files,
                            encrypted: format === ExportFormat.PGP,
                            passphrase,
                        })
                    );

                    state.stream = createArchive(iterators);
                    const { filename, stream, controller } = state;
                    yield fileStorage.writeFile(filename, stream, controller?.signal);
                    break;
                }
            }

            progressChannel.close();
            progressTask.cancel();

            return state.filename;
        } finally {
            if (yield cancelled()) {
                state.controller?.abort();
                if (!state.stream?.locked) void state.stream?.cancel();
                if (state.filename) void fileStorage.deleteFile(state.filename);
            }
        }
    },
});
