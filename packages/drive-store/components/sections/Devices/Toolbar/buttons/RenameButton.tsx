import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';

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
                icon={<IcPenSquare />}
                onClick={() => showRenameDeviceModal({ device: selectedDevices[0] })}
                data-testid="toolbar-rename"
            />
            {renameDeviceModal}
        </>
    );
};

export default RenameButton;
