import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import type { Device } from '../../../../../store';
import { useRemoveDeviceModal } from '../../../../modals/RemoveDeviceModal';
import { isMultiSelect } from '../../../ToolbarButtons/utils';

interface Props {
    selectedDevices: Device[];
}

const Remove = ({ selectedDevices }: Props) => {
    const [removeDeviceModal, showRemoveDeviceModal] = useRemoveDeviceModal();

    const isDisabled = isMultiSelect(selectedDevices);

    if (isDisabled) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Remove device`}
                icon={<IcTrash />}
                onClick={() => showRemoveDeviceModal({ device: selectedDevices[0] })}
                data-testid="toolbar-delete"
            />
            {removeDeviceModal}
        </>
    );
};

export default Remove;
