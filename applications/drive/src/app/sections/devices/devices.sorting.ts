import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortField, sortItems, stringComparator } from '../../modules/sorting';
import type { StoreDevice } from './useDevices.store';

const SORT_CONFIG = [{ field: SortField.name, comparator: stringComparator }];

function getDeviceSortValue(item: StoreDevice, field: SortField) {
    if (field === SortField.name) {
        return item.name;
    }
    return undefined;
}

export function sortDeviceItems(items: StoreDevice[]): string[] {
    return sortItems(items, SORT_CONFIG, SORT_DIRECTION.ASC, getDeviceSortValue, (item) => item.uid);
}
