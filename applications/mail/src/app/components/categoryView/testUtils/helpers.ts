import { getCategoryData } from '@proton/mail/features/categoriesView/categoriesHelpers';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export const mockActiveCategoriesData = [
    MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
    MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
    MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
    MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
]
    .map(getCategoryData)
    .map((data) => ({ ...data, display: true, notify: true }));

export const mockCategoriesStore = [
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        Name: 'Primary',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
        Name: 'Social',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
        Name: 'Promotion',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
        Name: 'Newsletter',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
        Name: 'Transaction',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
        Name: 'Update',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
    {
        ID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
        Name: 'Forum',
        Color: '#FFF',
        Type: LABEL_TYPE.SYSTEM_FOLDER,
        Order: 1,
        Path: '',
    },
];
