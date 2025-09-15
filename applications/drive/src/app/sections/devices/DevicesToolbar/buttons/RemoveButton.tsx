import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { isMultiSelect } from '../../../../components/sections/ToolbarButtons/utils';
import { useRemoveDeviceModal } from '../../../../modals/RemoveDeviceModal';
import type { StoreDevice } from '../../devices.store';

interface Props {
    selectedDevices: StoreDevice[];
}

export const DeviceRemoveButton = ({ selectedDevices }: Props) => {
    const [removeDeviceModal, showRemoveDeviceModal] = useRemoveDeviceModal();

    const isDisabled = isMultiSelect(selectedDevices);

    const onClick = () => {
        const device = selectedDevices[0];
        if (device) {
            showRemoveDeviceModal({
                deviceUid: device.uid,
                deviceName: device.name,
            });
        }
    };

    if (isDisabled) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Remove device`}
                icon={<Icon name="trash" />}
                onClick={onClick}
                data-testid="toolbar-delete"
            />
            {removeDeviceModal}
        </>
    );
};
