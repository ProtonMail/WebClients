import { c } from 'ttag';

import { linkPendingFiles } from '../../../lib/file-attachments/file-attachments.requests';
import { PendingFileLinkTracker } from '../../../lib/file-attachments/file-link.tracker';
import { getItemKey } from '../../../lib/items/item.utils';
import type { FileAttachmentsDTO, ItemRevision } from '../../../types';
import { getErrorMessage } from '../../../utils/errors/get-error-message';
import type { RootSagaOptions } from '../../types';

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
