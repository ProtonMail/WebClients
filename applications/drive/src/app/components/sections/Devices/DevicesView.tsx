import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useDevicesView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import Devices from './Devices';
import DevicesToolbar from './Toolbar/DevicesToolbar';
import { getDevicesSectionName } from './constants';

function DevicesView() {
    const sectionTitle = getDevicesSectionName();
    useAppTitle(sectionTitle);

    const driveView = useDevicesView();

    return (
        <FileBrowserStateProvider itemIds={driveView.items.map(({ id }) => id)}>
            <DevicesToolbar items={driveView.items} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{sectionTitle}</div>
                <Devices view={driveView} />
            </PrivateMainArea>
        </FileBrowserStateProvider>
    );
}

export default DevicesView;
