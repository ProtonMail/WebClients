import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

const { SPAM, TRASH } = MAILBOX_LABEL_IDS;

export function isAllowedAutoDeleteLabelID(labelID: string): labelID is typeof SPAM | typeof TRASH {
    if ([SPAM, TRASH].some((systemFolderId) => systemFolderId === labelID)) {
        return true;
    }
    return false;
}
