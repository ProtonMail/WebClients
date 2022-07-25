import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { Device } from '../../../../../store';
import useOpenModal from '../../../../useOpenModal';
import { isMultiSelect } from '../../../ToolbarButtons/utils';

interface Props {
    selectedDevices: Device[];
}

const Remove = ({ selectedDevices }: Props) => {
    const { openRemoveDevice } = useOpenModal();

    const isDisabled = isMultiSelect(selectedDevices);

    if (isDisabled) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Remove device`}
            icon={<Icon name="trash" />}
            onClick={() => openRemoveDevice(selectedDevices[0])}
            data-testid="toolbar-delete"
        />
    );
};

export default Remove;
