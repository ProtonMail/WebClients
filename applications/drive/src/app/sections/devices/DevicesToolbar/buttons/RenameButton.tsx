import { c } from 'ttag';

import { Icon, ToolbarButton, useModalTwoStatic } from '@proton/components';

import { isMultiSelect } from '../../../../components/sections/ToolbarButtons/utils';
import { RenameDeviceModal } from '../../../../modals/RenameDeviceModal';
import { type StoreDevice } from '../../devices.store';

interface Props {
    selectedDevices: StoreDevice[];
}

export const DeviceRenameButton = ({ selectedDevices }: Props) => {
    const [renameDeviceModal, showRenameDeviceModal] = useModalTwoStatic(RenameDeviceModal);

    const isDisabled = isMultiSelect(selectedDevices);

    const onClick = () => {
        const device = selectedDevices[0];
        if (device) {
            showRenameDeviceModal({
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
                title={c('Action').t`Rename`}
                icon={<Icon name="pen-square" />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
            {renameDeviceModal}
        </>
    );
};
