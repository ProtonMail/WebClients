import { isCategoryLabel, isCustomLabelOrFolder, isStringHumanLabelID } from '@proton/mail/helpers/location';
import type { EmailListDisplayTime } from '@proton/metrics/types/web_mail_performance_email_list_display_time_histogram_v1.schema';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { MAIL_PAGE_SIZE } from '@proton/shared/lib/mail/mailSettings';

export type LabelType = EmailListDisplayTime['Labels']['loaded'];

type SupportedLabelID = Exclude<
    MAILBOX_LABEL_IDS,
    | MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
    | MAILBOX_LABEL_IDS.CATEGORY_FORUMS
    | MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS
    | MAILBOX_LABEL_IDS.CATEGORY_UPDATES
    | MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS
    | MAILBOX_LABEL_IDS.CATEGORY_SOCIAL
    | MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS
>;

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

export const getLabelID = (labelID: string): SupportedLabelID | 'custom' => {
    if (isCustomLabelOrFolder(labelID)) {
        return 'custom';
    }

    if (isCategoryLabel(labelID)) {
        return MAILBOX_LABEL_IDS.INBOX;
    }

    return labelID as SupportedLabelID;
};

export const pathnameToLabelName = (pathname: string) => {
    const cleanedPathname = pathname.startsWith('/') ? pathname.split('/')[1] : pathname;
    if (isStringHumanLabelID(cleanedPathname)) {
        return cleanedPathname as LabelType;
    }
    return 'custom';
};
