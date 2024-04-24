import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { useDevicesListing } from '../_devices';
import { useUserSettings } from '../_settings';
import { useMemoArrayNoMatterTheOrder } from './utils';
import { SortField, useSortingWithDefault } from './utils/useSortingDevices';

const DEFAULT_SORT = {
    sortField: 'name' as SortField,
    sortOrder: SORT_DIRECTION.ASC,
};

export default function useDevicesView() {
    const devicesListing = useDevicesListing();

    const devices = devicesListing.cachedDevices;

    const cachedDevices = useMemoArrayNoMatterTheOrder(devices);

    const { layout } = useUserSettings();
    const { sortedList } = useSortingWithDefault(cachedDevices, DEFAULT_SORT);

    return {
        layout,
        items: sortedList,
        isLoading: devicesListing.isLoading,
    };
}
