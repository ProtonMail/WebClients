import { c } from 'ttag';

import { type IconName } from '@proton/icons';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export const DISABLED_BADGE = 'DISABLE_CATEGORY_BADGE';

export type CategoryBadgeMapping = Record<
    string,
    { label: string; className: string; darkClassName: string; icon: IconName }
>;

export const getCategoriesBadgeMapping = (): CategoryBadgeMapping => {
    return {
        [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: {
            label: c('Label').t`Primary`,
            className: 'bg-iris-100 color-iris-700 hover:bg-iris-200 hover:color-iris-900',
            darkClassName: 'bg-iris-900 color-iris-300 hover:bg-iris-800 hover:color-iris-100',
            icon: 'inbox-filled',
        },
        [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: {
            label: c('Label').t`Social`,
            className: 'bg-sky-100 color-sky-700 hover:bg-sky-200 hover:color-sky-900',
            darkClassName: 'bg-sky-900 color-sky-300 hover:bg-sky-800 hover:color-sky-100',
            icon: 'person-filled-2',
        },
        [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: {
            label: c('Label').t`Promotions`,
            className: 'bg-teal-100 color-teal-700 hover:bg-teal-200 hover:color-teal-900',
            darkClassName: 'bg-teal-900 color-teal-300 hover:bg-teal-800 hover:color-teal-100',
            icon: 'megaphone-filled',
        },
        [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: {
            label: c('Label').t`Newsletters`,
            className: 'bg-pink-100 color-pink-700 hover:bg-pink-200 hover:color-pink-900',
            darkClassName: 'bg-pink-900 color-pink-300 hover:bg-pink-800 hover:color-pink-100',
            icon: 'news',
        },
        [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: {
            label: c('Label').t`Transactions`,
            className: 'bg-blue-100 color-blue-700 hover:bg-blue-200 hover:color-blue-900',
            darkClassName: 'bg-blue-900 color-blue-300 hover:bg-blue-800 hover:color-blue-100',
            icon: 'credit-cards',
        },
        [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: {
            label: c('Label').t`Updates`,
            className: 'bg-purple-100 color-purple-700 hover:bg-purple-200 hover:color-purple-900',
            darkClassName: 'bg-purple-900 color-purple-300 hover:bg-purple-800 hover:color-purple-100',
            icon: 'bell-filled-2',
        },
        [MAILBOX_LABEL_IDS.CATEGORY_FORUMS]: {
            label: c('Label').t`Forums`,
            className: 'bg-amber-100 color-amber-700 hover:bg-amber-200 hover:color-amber-900',
            darkClassName: 'bg-amber-900 color-amber-300 hover:bg-amber-800 hover:color-amber-100',
            icon: 'speech-bubbles-filled',
        },
    };
};
