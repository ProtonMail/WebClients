import { c } from 'ttag';

import type { Device } from '../../../../../store';
import type { useRenameDeviceModal } from '../../../../modals/RenameDeviceModal';
import { ContextMenuButton } from '../../../ContextMenu';

interface Props {
    device: Device;
    showRenameDeviceModal: ReturnType<typeof useRenameDeviceModal>[1];
    close: () => void;
}

const RenameButton = ({ device, showRenameDeviceModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Rename`}
            icon="pen-square"
            testId="context-menu-rename"
            action={() => showRenameDeviceModal({ device })}
            close={close}
        />
    );
};

export default RenameButton;
