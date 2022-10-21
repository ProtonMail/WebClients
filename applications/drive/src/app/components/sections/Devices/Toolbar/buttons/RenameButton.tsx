import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { Device } from '../../../../../store';
import useOpenModal from '../../../../useOpenModal';
import { isMultiSelect } from '../../../ToolbarButtons/utils';

interface Props {
    selectedDevices: Device[];
}

const RenameButton = ({ selectedDevices }: Props) => {
    const { openRenameDevice } = useOpenModal();

    const isDisabled = isMultiSelect(selectedDevices);

    if (isDisabled) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Rename`}
            icon={<Icon name="pen-square" />}
            onClick={() => openRenameDevice(selectedDevices[0])}
            data-testid="toolbar-rename"
        />
    );
};

export default RenameButton;
