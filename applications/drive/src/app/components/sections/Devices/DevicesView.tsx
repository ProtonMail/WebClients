import { c } from 'ttag';

import { PrivateMainArea, useAppTitle } from '@proton/components';

import { useDevicesView } from '../../../store';
import { FileBrowserStateProvider } from '../../FileBrowser';
import Devices from './Devices';
import DevicesToolbar from './Toolbar/DevicesToolbar';

function DevicesView() {
    useAppTitle(c('Title').t`Synced devices`);

    const driveView = useDevicesView();

    return (
        <FileBrowserStateProvider itemIds={driveView.items.map(({ id }) => id)}>
            <DevicesToolbar items={driveView.items} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="p1 text-strong border-bottom section--header">{c('Info').t`Synced devices`}</div>
                <Devices view={driveView} />
            </PrivateMainArea>
        </FileBrowserStateProvider>
    );
}

export default DevicesView;
