import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';

import { isMultiSelect } from '../../../../components/sections/ToolbarButtons/utils';
import { useRenameDeviceModal } from '../../../../modals/RenameDeviceModal';
import type { StoreDevice } from '../../devices.store';

interface Props {
    selectedDevices: StoreDevice[];
}

export const DeviceRenameButton = ({ selectedDevices }: Props) => {
    const { renameDeviceModal, showRenameDeviceModal } = useRenameDeviceModal();

    const isDisabled = isMultiSelect(selectedDevices);

    const onClick = () => {
        const device = selectedDevices[0];
        if (device) {
            showRenameDeviceModal({ deviceUid: device.uid });
        }
    };

    if (isDisabled) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Rename`}
                icon={<IcPenSquare />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
            {renameDeviceModal}
        </>
    );
};
