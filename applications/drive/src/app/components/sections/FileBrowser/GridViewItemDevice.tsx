import { Icon } from '@proton/components';

import type { DeviceItem } from '../Devices/Devices';
import GridViewItemBase from './GridViewItem';
import { getDeviceIconText } from './utils';

export function GridViewItemDevice({ item }: { item: DeviceItem }) {
    const iconText = getDeviceIconText(item.name);

    return (
        <GridViewItemBase
            IconComponent={<Icon name="tv" size={10} alt={iconText}></Icon>}
            item={item}
            disableSelection
        />
    );
}
