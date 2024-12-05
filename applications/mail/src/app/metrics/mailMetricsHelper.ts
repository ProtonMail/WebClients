import type { EmailListDisplayTime } from '@proton/metrics/types/web_mail_performance_email_list_display_time_histogram_v1.schema';
import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

import { getHumanLabelID, isCustomLabelOrFolder, isStringHumanLabelID } from '../helpers/labels';

type LabelType = EmailListDisplayTime['Labels']['loaded'];

export const MAX_MAP_SIZE = 20;

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

export const getLabelName = (labelID: string) => {
    const humanLabel = getHumanLabelID(labelID);
    if (humanLabel !== labelID) {
        return humanLabel as LabelType;
    }
    return 'custom';
};

export const pathnameToLabelName = (pathname: string) => {
    const cleanedPathname = pathname.startsWith('/') ? pathname.split('/')[1] : pathname;
    if (isStringHumanLabelID(cleanedPathname)) {
        return cleanedPathname as LabelType;
    }
    return 'custom';
};
