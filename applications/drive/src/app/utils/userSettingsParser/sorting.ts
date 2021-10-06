import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { DriveSectionSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';
import { SortSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { fieldMap } from './constants';

export const parseSetting = (sortSetting: SortSetting) => {
    const sortOrder = sortSetting < 0 ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
    const sortField = fieldMap[sortSetting];
    return {
        sortOrder,
        sortField,
    };
};

export const getSetting = ({ sortField, sortOrder }: SortParams<DriveSectionSortKeys>) => {
    const sortSettingValue = Object.entries(fieldMap).find(([setting, fieldName]) => {
        if (fieldName === sortField) {
            const settingValue = Number(setting);
            const isSameDirection =
                (sortOrder === SORT_DIRECTION.ASC && settingValue > 0) ||
                (sortOrder === SORT_DIRECTION.DESC && settingValue < 0);
            return isSameDirection;
        }
        return false;
    })?.[0];

    return Number(sortSettingValue);
};
