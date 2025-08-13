import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Row } from '@proton/components';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { withHoc } from '../../hooks/withHoc';
import { type DeviceState, useDeviceState } from './useDeviceState';

export const Device = withHoc<{}, DeviceState>(useDeviceState, DeviceView);

function DeviceView(deviceState: DeviceState) {
    const downloadInfo = () => {
        const blob = new Blob([JSON.stringify(deviceState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    return (
        <>
            <Button onClick={downloadInfo} className="mb-4">{c('Action').t`Download info`}</Button>

            <InfoRow label="SDK version" value={deviceState.versions.sdkVersion} />
            <InfoRow label="App version" value={deviceState.versions.appVersion} />
            <InfoRow label="Time" value={deviceState.time.currentTime} />
            <InfoRow label="Timezone" value={deviceState.time.timezone} />
            <InfoRow label="Server time" value={deviceState.time.serverTime} />
            <InfoRow label="Browser" value={deviceState.browser.userAgent} />
            <InfoRow
                label="Service worker"
                value={deviceState.serviceWorker.available ? 'Available' : 'Not available'}
            />
            <InfoRow label="Service worker state" value={deviceState.serviceWorker.state || 'N/A'} />
            <InfoRow label="OPFS" value={deviceState.opfs.available ? 'Available' : 'Not available'} />
            <InfoRow
                label="OPFS quota"
                value={deviceState.opfs.quota ? humanSize({ bytes: deviceState.opfs.quota }) : 'N/A'}
            />
            <InfoRow
                label="OPFS usage"
                value={deviceState.opfs.usage ? humanSize({ bytes: deviceState.opfs.usage }) : 'N/A'}
            />
            <InfoRow label="Search" value={deviceState.search} />
            <InfoRow label="Drive API" value={deviceState.api.drive} />
        </>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Row>
            <span className="label cursor-default">{label}</span>
            <div className="pt-2">
                <b>{value}</b>
            </div>
        </Row>
    );
}
