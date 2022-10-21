import { c } from 'ttag';

import { Device } from '../../../../../store';
import useOpenModal from '../../../../useOpenModal';
import { ContextMenuButton } from '../../../ContextMenu';

interface Props {
    selectedDevices: Device[];
    close: () => void;
}

const RemoveButton = ({ selectedDevices, close }: Props) => {
    const { openRemoveDevice } = useOpenModal();
    return (
        <ContextMenuButton
            name={c('Action').t`Remove`}
            icon="trash"
            testId="context-menu-rename"
            action={() => openRemoveDevice(selectedDevices[0])}
            close={close}
        />
    );
};

export default RemoveButton;
