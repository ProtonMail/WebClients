import type { IconName } from '@proton/icons/types';
import type { CategoryLabelID } from '@proton/shared/lib/constants';

export interface CategoryTab {
    id: CategoryLabelID;
    filledIcon: IconName;
    display?: boolean;
    notify?: boolean;
    colorShade: CATEGORIES_COLOR_SHADES;
}

export enum CATEGORIES_COLOR_SHADES {
    IRIS = 'iris',
    CYAN = 'cyan',
    TEAL = 'teal',
    ORANGE = 'orange',
    RED = 'red',
    PINK = 'pink',
    BLUE = 'blue',
}
