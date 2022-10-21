import { Icon } from '@proton/components';

import { DeviceItem } from '../Devices/Devices';
import GridViewItemBase from './GridViewItem';
import { getDeviceIconText } from './utils';

export function GridViewItemDevice({ item }: { item: DeviceItem }) {
    const iconText = getDeviceIconText(item.name);

    return (
        <GridViewItemBase
            IconComponent={<Icon name="tv" size={42} alt={iconText}></Icon>}
            item={item}
            disableSelection
        />
    );
}
