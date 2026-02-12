import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import { isMultiSelect } from '../../../../components/sections/ToolbarButtons/utils';
import { useRemoveDeviceModal } from '../../../../modals/RemoveDeviceModal';
import type { StoreDevice } from '../../devices.store';

interface Props {
    selectedDevices: StoreDevice[];
}

export const DeviceRemoveButton = ({ selectedDevices }: Props) => {
    const { removeDeviceModal, showRemoveDeviceModal } = useRemoveDeviceModal();

    const isDisabled = isMultiSelect(selectedDevices);

    const onClick = () => {
        const device = selectedDevices[0];
        if (device) {
            showRemoveDeviceModal({ deviceUid: device.uid });
        }
    };

    if (isDisabled) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Remove device`}
                icon={<IcTrash />}
                onClick={onClick}
                data-testid="toolbar-delete"
            />
            {removeDeviceModal}
        </>
    );
};
