import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export type AutoDeleteBannerType = 'disabled' | 'enabled' | 'paid-banner' | 'free-banner' | 'hide';

export type AutoDeleteLabelIDs = MAILBOX_LABEL_IDS.TRASH | MAILBOX_LABEL_IDS.SPAM;
