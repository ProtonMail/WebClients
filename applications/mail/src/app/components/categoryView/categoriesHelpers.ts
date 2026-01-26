import type { CategoryTab } from '@proton/mail';
import { ACCENT_COLORS } from '@proton/shared/lib/colors';

import type { SystemFolder } from 'proton-mail/hooks/useMoveSystemFolders';
import { SYSTEM_FOLDER_SECTION } from 'proton-mail/hooks/useMoveSystemFolders';

import { getLabelFromCategoryId } from './categoriesStringHelpers';

export const getCategorySystemFolder = (category: CategoryTab): SystemFolder => {
    const label = getLabelFromCategoryId(category.id);

    return {
        labelID: category.id,
        ID: category.id,
        icon: category.icon,
        text: label,
        visible: true,
        order: 0,
        display: SYSTEM_FOLDER_SECTION.MORE,
        payloadExtras: {
            Name: label,
            Color: ACCENT_COLORS[0],
        },
    };
};
