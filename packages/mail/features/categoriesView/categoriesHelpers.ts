import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import type { CategoryTab } from './categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from './categoriesConstants';

const RAW_TO_CATEGORY: Record<string, CategoryTab> = {
    '24': {
        id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
    },
    '20': {
        id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
        colorShade: CATEGORIES_COLOR_SHADES.CYAN,
    },
    '21': {
        id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
        colorShade: CATEGORIES_COLOR_SHADES.TEAL,
    },
    '25': {
        id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
        colorShade: CATEGORIES_COLOR_SHADES.ORANGE,
    },
    '26': {
        id: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
        colorShade: CATEGORIES_COLOR_SHADES.RED,
    },
    '22': {
        id: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
        colorShade: CATEGORIES_COLOR_SHADES.PINK,
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

export const getCategoryTabFromLabel = (data: Label): CategoryTab => {
    return {
        ...getCategoryData(data.ID),
        display: !!data.Display,
        notify: !!data.Notify,
    };
};

const CATEGORIES_SHORTCUTS_MAPPING: Record<CategoryLabelID, string[]> = {
    [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: ['G', 'I'],
    [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: ['C', 'S'],
    [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: ['C', 'P'],
    [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]: ['C', 'N'],
    [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS]: ['C', 'T'],
    [MAILBOX_LABEL_IDS.CATEGORY_UPDATES]: ['C', 'U'],
};

export const getCategoryCommanderKeyboardShortcut = (id: CategoryLabelID): string[] => {
    return CATEGORIES_SHORTCUTS_MAPPING[id];
};
