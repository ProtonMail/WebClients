import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { SortSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

export interface UserSortParams {
    sortField: 'fileModifyTime' | 'name' | 'size' | 'mimeType';
    sortOrder: SORT_DIRECTION;
}

export const settingsToSortParams: { [key in SortSetting]: UserSortParams } = {
    [SortSetting.ModifiedAsc]: { sortField: 'fileModifyTime', sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.ModifiedDesc]: { sortField: 'fileModifyTime', sortOrder: SORT_DIRECTION.DESC },
    [SortSetting.NameAsc]: { sortField: 'name', sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.NameDesc]: { sortField: 'name', sortOrder: SORT_DIRECTION.DESC },
    [SortSetting.SizeAsc]: { sortField: 'size', sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.SizeDesc]: { sortField: 'size', sortOrder: SORT_DIRECTION.DESC },
    [SortSetting.TypeAsc]: { sortField: 'mimeType', sortOrder: SORT_DIRECTION.ASC },
    [SortSetting.TypeDesc]: { sortField: 'mimeType', sortOrder: SORT_DIRECTION.DESC },
};

export const parseSetting = (sortSetting: SortSetting): UserSortParams => {
    return settingsToSortParams[sortSetting];
};

export const getSetting = ({ sortField, sortOrder }: UserSortParams): SortSetting | undefined => {
    const value = Object.entries(settingsToSortParams).find(([, sortParams]) => {
        return sortParams.sortField === sortField && sortParams.sortOrder === sortOrder;
    });
    return value ? Number(value[0]) : undefined;
};
