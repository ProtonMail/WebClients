import { type IconName } from '@proton/icons';

export enum CATEGORY_LABEL_IDS {
    CATEGORY_SOCIAL = '20',
    CATEGORY_PROMOTIONS = '21',
    CATEGORY_UPDATES = '22',
    CATEGORY_FORUMS = '23',
    CATEGORY_DEFAULT = '24',
    CATEGORY_NEWSLETTER = '25',
    CATEGORY_TRANSACTIONS = '26',
}

export const categoryBadgeMapping: Record<
    string,
    { label: string; className: string; darkClassName: string; icon?: IconName }
> = {
    [CATEGORY_LABEL_IDS.CATEGORY_SOCIAL]: {
        label: 'Social',
        className: 'category-badge--social',
        darkClassName: 'category-badge--social-dark',
    },
    [CATEGORY_LABEL_IDS.CATEGORY_PROMOTIONS]: {
        label: 'Promotions',
        className: 'category-badge--promotions',
        darkClassName: 'category-badge--promotions-dark',
    },
    [CATEGORY_LABEL_IDS.CATEGORY_UPDATES]: {
        label: 'Updates',
        className: 'category-badge--updates',
        darkClassName: 'category-badge--updates-dark',
    },
    [CATEGORY_LABEL_IDS.CATEGORY_FORUMS]: {
        label: 'Forums',
        className: 'category-badge--forums',
        darkClassName: 'category-badge--forums-dark',
    },
    [CATEGORY_LABEL_IDS.CATEGORY_DEFAULT]: {
        label: 'Default',
        className: 'category-badge--default',
        darkClassName: 'category-badge--default-dark',
    },
    [CATEGORY_LABEL_IDS.CATEGORY_NEWSLETTER]: {
        label: 'Newsletters',
        className: 'category-badge--newsletters',
        darkClassName: 'category-badge--newsletters-dark',
    },
};
