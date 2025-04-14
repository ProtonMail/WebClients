import { c } from 'ttag';

import { linkPendingFiles } from '@proton/pass/lib/file-attachments/file-attachments.requests';
import { PendingFileLinkTracker } from '@proton/pass/lib/file-attachments/file-link.tracker';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { FileAttachmentsDTO, ItemRevision } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';

export function* itemLinkPendingFiles(
    item: ItemRevision,
    files: FileAttachmentsDTO,
    options: RootSagaOptions
): Generator<Promise<ItemRevision>, ItemRevision> {
    const { shareId, itemId, revision } = item;
    const key = getItemKey(item);
    const release = PendingFileLinkTracker.track(key);

    try {
        const linked: ItemRevision = yield linkPendingFiles({ shareId, itemId, files, revision });
        return linked;
    } catch (err) {
        options.onNotification?.({
            type: 'error',
            text: getErrorMessage(err, c('Pass_file_attachments').t`Failed linking files to item`),
        });

        return item;
    } finally {
        release();
    }
}
