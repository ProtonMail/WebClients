import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { SortSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { SortField } from '../_views/utils/useSorting';

export interface UserSortParams {
    sortField: SortField.fileModifyTime | SortField.name | SortField.size;
    sortOrder: SORT_DIRECTION;
}

export const settingsToSortParams: { [key in SortSetting]: UserSortParams } = {
    [SortSetting.ModifiedAsc]: { sortField: SortField.fileModifyTime, sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.ModifiedDesc]: { sortField: SortField.fileModifyTime, sortOrder: SORT_DIRECTION.DESC },
    [SortSetting.NameAsc]: { sortField: SortField.name, sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.NameDesc]: { sortField: SortField.name, sortOrder: SORT_DIRECTION.DESC },
    [SortSetting.SizeAsc]: { sortField: SortField.size, sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.SizeDesc]: { sortField: SortField.size, sortOrder: SORT_DIRECTION.DESC },
};

const DEFAULT_SORT_SETTING = settingsToSortParams[SortSetting.ModifiedDesc];

export const parseSetting = (sortSetting: SortSetting): UserSortParams => {
    return settingsToSortParams[sortSetting] || DEFAULT_SORT_SETTING;
};

export const getSetting = ({ sortField, sortOrder }: UserSortParams): SortSetting | undefined => {
    const value = Object.entries(settingsToSortParams).find(([, sortParams]) => {
        return sortParams.sortField === sortField && sortParams.sortOrder === sortOrder;
    });
    return value ? Number(value[0]) : undefined;
};
