import { c } from 'ttag';

import { linkPendingFiles } from '@proton/pass/lib/file-attachments/file-attachments.requests';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { FileAttachmentsDTO, ItemRevision } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';

export function* itemLinkPendingFiles(
    item: ItemRevision,
    files: FileAttachmentsDTO,
    options: RootSagaOptions
): Generator<Promise<ItemRevision>, ItemRevision> {
    try {
        const { shareId, itemId, revision } = item;
        const linked: ItemRevision = yield linkPendingFiles({ shareId, itemId, files, revision });
        return linked;
    } catch (err) {
        options.onNotification?.({
            type: 'error',
            text: getErrorMessage(err, c('Pass_file_attachments').t`Failed linking files to item`),
        });

        return item;
    }
}
