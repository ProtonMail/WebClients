import { type IconName } from '@proton/icons';

export enum CATEGORIES_COLOR_SHADES {
    IRIS = 'iris',
    SKY = 'sky',
    TEAL = 'teal',
    PINK = 'pink',
    BLUE = 'blue',
    PURPLE = 'purple',
    AMBER = 'amber',
}

export enum CATEGORY_LABEL_IDS {
    CATEGORY_SOCIAL = '20',
    CATEGORY_PROMOTIONS = '21',
    CATEGORY_UPDATES = '22',
    CATEGORY_FORUMS = '23',
    CATEGORY_DEFAULT = '24',
    CATEGORY_NEWSLETTER = '25',
    CATEGORY_TRANSACTIONS = '26',
}

// The order of the categories is important.
export const categoriesArray: {
    colorShade: CATEGORIES_COLOR_SHADES;
    icon: IconName;
    id: CATEGORY_LABEL_IDS;
}[] = [
    {
        colorShade: CATEGORIES_COLOR_SHADES.IRIS,
        icon: 'bolt-filled',
        id: CATEGORY_LABEL_IDS.CATEGORY_DEFAULT,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.SKY,
        icon: 'person-filled-2',
        id: CATEGORY_LABEL_IDS.CATEGORY_SOCIAL,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.TEAL,
        icon: 'bolt-filled',
        id: CATEGORY_LABEL_IDS.CATEGORY_PROMOTIONS,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.PINK,
        icon: 'news',
        id: CATEGORY_LABEL_IDS.CATEGORY_NEWSLETTER,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.BLUE,
        icon: 'credit-cards',
        id: CATEGORY_LABEL_IDS.CATEGORY_TRANSACTIONS,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.PURPLE,
        icon: 'bell-filled-2',
        id: CATEGORY_LABEL_IDS.CATEGORY_UPDATES,
    },
    {
        colorShade: CATEGORIES_COLOR_SHADES.AMBER,
        icon: 'speech-bubbles-filled',
        id: CATEGORY_LABEL_IDS.CATEGORY_FORUMS,
    },
];
