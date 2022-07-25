import { c } from 'ttag';

import { Device } from '../../../../../store';
import useOpenModal from '../../../../useOpenModal';
import { ContextMenuButton } from '../../../ContextMenu';

interface Props {
    close: () => void;
    selectedDevices: Device[];
}

const RenameButton = ({ close, selectedDevices }: Props) => {
    const { openRenameDevice } = useOpenModal();

    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() => openRenameDevice(selectedDevices[0])}
            close={close}
        />
    );
};

export default RenameButton;
