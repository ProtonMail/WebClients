import { useAppTitle } from '@proton/components';

import { useDevicesView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { Devices } from './Devices';
import { DevicesToolbar } from './Toolbar/DevicesToolbar';
import { getDevicesSectionName } from './constants';

/**
 * @deprecated
 **/
export function DevicesViewDeprecated() {
    const sectionTitle = getDevicesSectionName();
    useAppTitle(sectionTitle);

    const devicesView = useDevicesView();

    return (
        <FileBrowserStateProvider itemIds={devicesView.items.map(({ id }) => id)}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{sectionTitle}</span>}
                toolbar={<DevicesToolbar items={devicesView.items} />}
            />
            <Devices view={devicesView} />
        </FileBrowserStateProvider>
    );
}
