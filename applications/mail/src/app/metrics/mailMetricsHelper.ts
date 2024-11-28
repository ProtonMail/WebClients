import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { isCustomLabelOrFolder } from '../helpers/labels';

export const getPageSizeString = (settings: MailSettings | undefined) => {
    const { PageSize } = settings || {};
    switch (PageSize) {
        case MAIL_PAGE_SIZE.FIFTY:
            return '50';
        case MAIL_PAGE_SIZE.ONE_HUNDRED:
            return '100';
        case MAIL_PAGE_SIZE.TWO_HUNDRED:
            return '200';
    }

    return '50';
};

export const getLabelID = (labelID: string) => {
    if (isCustomLabelOrFolder(labelID)) {
        return 'custom';
    }

    return labelID as MAILBOX_LABEL_IDS;
};
