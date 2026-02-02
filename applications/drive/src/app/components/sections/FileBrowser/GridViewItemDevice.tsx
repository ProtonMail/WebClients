import { IcTv } from '@proton/icons/icons/IcTv';

import type { DeviceItem } from '../interface';
import GridViewItemBase from './GridViewItem';
import { getDeviceIconText } from './utils';

export function GridViewItemDevice({ item }: { item: DeviceItem }) {
    const iconText = getDeviceIconText(item.name);

    return <GridViewItemBase IconComponent={<IcTv size={10} alt={iconText} />} item={item} disableSelection />;
}
