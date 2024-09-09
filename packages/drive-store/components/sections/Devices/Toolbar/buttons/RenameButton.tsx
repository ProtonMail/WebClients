import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import type { Device } from '../../../../../store';
import { useRenameDeviceModal } from '../../../../modals/RenameDeviceModal';
import { isMultiSelect } from '../../../ToolbarButtons/utils';

interface Props {
    selectedDevices: Device[];
}

const RenameButton = ({ selectedDevices }: Props) => {
    const [renameDeviceModal, showRenameDeviceModal] = useRenameDeviceModal();

    const isDisabled = isMultiSelect(selectedDevices);

    if (isDisabled) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Rename`}
                icon={<Icon name="pen-square" />}
                onClick={() => showRenameDeviceModal({ device: selectedDevices[0] })}
                data-testid="toolbar-rename"
            />
            {renameDeviceModal}
        </>
    );
};

export default RenameButton;
