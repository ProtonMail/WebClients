import { useMultiSortedList } from '@proton/components';
import { useMemo } from 'react';
import { SortConfig } from '@proton/components/hooks/useSortedList';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { LinkMeta, SortKeys, SortParams } from '../../interfaces/link';
import useUserSettings from './useUserSettings';
import { SortSetting } from '../../interfaces/userSettings';

const getNameSortConfig = (direction = SORT_DIRECTION.ASC) => ({
    key: 'Name' as SortKeys,
    direction,
    compare: (a: LinkMeta['Name'], b: LinkMeta['Name']) => a.localeCompare(b),
});

const fieldMap: { [key in SortSetting]: SortKeys } = {
    [SortSetting.ModifiedAsc]: 'ModifyTime',
    [SortSetting.ModifiedDesc]: 'ModifyTime',
    [SortSetting.NameAsc]: 'Name',
    [SortSetting.NameDesc]: 'Name',
    [SortSetting.SizeAsc]: 'Size',
    [SortSetting.SizeDesc]: 'Size',
    [SortSetting.TypeAsc]: 'MIMEType',
    [SortSetting.TypeDesc]: 'MIMEType',
};

function useDriveSorting(getList: (sortParams: SortParams) => LinkMeta[]) {
    const { sort, changeSort } = useUserSettings();

    const sortParams = useMemo((): SortParams => {
        const sortOrder = sort < 0 ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
        const sortField = fieldMap[sort];
        return {
            sortOrder,
            sortField,
        };
    }, [sort]);

    const getConfig = (sortField: SortKeys, direction: SORT_DIRECTION) => {
        const configs: {
            [key in SortKeys]: SortConfig<LinkMeta>[];
        } = {
            Name: [{ key: 'Type', direction: SORT_DIRECTION.ASC }, getNameSortConfig(direction)],
            MIMEType: [{ key: 'MIMEType', direction }, { key: 'Type', direction }, getNameSortConfig()],
            ModifyTime: [{ key: 'ModifyTime', direction }, getNameSortConfig()],
            Size: [{ key: 'Type', direction }, { key: 'Size', direction }, getNameSortConfig()],
        };
        return configs[sortField];
    };

    const { sortedList, setConfigs } = useMultiSortedList(
        getList(sortParams),
        getConfig(sortParams.sortField, sortParams.sortOrder)
    );

    const setSorting = async (sortField: SortKeys, sortOrder: SORT_DIRECTION) => {
        setConfigs(getConfig(sortField, sortOrder));
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

        if (sortSettingValue) {
            await changeSort(Number(sortSettingValue));
        }
    };

    return {
        sortParams,
        sortedList,
        setSorting,
    };
}

export default useDriveSorting;
