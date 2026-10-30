import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export const isCustomLabelOrFolder = (labelID: string) =>
    !Object.values(MAILBOX_LABEL_IDS).includes(labelID as MAILBOX_LABEL_IDS);
