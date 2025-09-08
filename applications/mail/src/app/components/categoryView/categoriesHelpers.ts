import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { CategoryTab } from './categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from './categoriesConstants';

const RAW_TO_CATEGORY = {
    '24': {
        id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
        icon: 'inbox-filled',
    },
    '20': {
        id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
        colorShade: CATEGORIES_COLOR_SHADES.SKY,
        icon: 'person-filled-2',
    },
    '21': {
        id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
        colorShade: CATEGORIES_COLOR_SHADES.TEAL,
        icon: 'megaphone-filled',
    },
    '25': {
        id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
        colorShade: CATEGORIES_COLOR_SHADES.PINK,
        icon: 'news',
    },
    '26': {
        id: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
        colorShade: CATEGORIES_COLOR_SHADES.BLUE,
        icon: 'credit-cards',
    },
    '22': {
        id: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
        colorShade: CATEGORIES_COLOR_SHADES.PURPLE,
        icon: 'bell-filled-2',
    },
    '23': {
        id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
        colorShade: CATEGORIES_COLOR_SHADES.AMBER,
        icon: 'speech-bubbles-filled',
    },
} as const;

type RawId = keyof typeof RAW_TO_CATEGORY;

export const getCategoryData = (id: string): CategoryTab => {
    const data = RAW_TO_CATEGORY[id as RawId];
    if (!data) {
        throw new Error(`Invalid category ID: ${id}`);
    }
    return data;
};
