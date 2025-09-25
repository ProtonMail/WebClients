import type { IconName } from '@proton/icons';
import type { CategoryLabelID } from '@proton/shared/lib/constants';

export interface CategoryTab {
    id: CategoryLabelID;
    icon: IconName;
    display?: boolean;
    notify?: boolean;
    colorShade: CATEGORIES_COLOR_SHADES;
}

export enum CATEGORIES_COLOR_SHADES {
    IRIS = 'iris',
    SKY = 'sky',
    TEAL = 'teal',
    PINK = 'pink',
    BLUE = 'blue',
    PURPLE = 'purple',
    AMBER = 'amber',
}
