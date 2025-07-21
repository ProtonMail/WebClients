import { type IconName } from '@proton/icons';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

export enum CATEGORIES_COLOR_SHADES {
    IRIS = 'iris',
    SKY = 'sky',
    TEAL = 'teal',
    PINK = 'pink',
    BLUE = 'blue',
    PURPLE = 'purple',
    AMBER = 'amber',
}

// The order of the categories is important.
export const categoriesArray: {
    colorShade: CATEGORIES_COLOR_SHADES;
    icon: IconName;
    id: MAILBOX_LABEL_IDS;
}[] = [
    {
        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
        icon: 'bolt-filled',
        id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.SKY,
        icon: 'person-filled-2',
        id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.TEAL,
        icon: 'megaphone-filled',
        id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.PINK,
        icon: 'news',
        id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.BLUE,
        icon: 'credit-cards',
        id: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.PURPLE,
        icon: 'bell-filled-2',
        id: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.AMBER,
        icon: 'speech-bubbles-filled',
        id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
    },
];
