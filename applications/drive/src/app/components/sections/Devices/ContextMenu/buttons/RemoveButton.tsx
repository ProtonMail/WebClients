import { c } from 'ttag';

import { Device } from '../../../../../store';
import { useRemoveDeviceModal } from '../../../../modals/RemoveDeviceModal';
import { ContextMenuButton } from '../../../ContextMenu';

interface Props {
    device: Device;
    showRemoveDeviceModal: ReturnType<typeof useRemoveDeviceModal>[1];
    close: () => void;
}

const RemoveButton = ({ device, showRemoveDeviceModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Remove`}
            icon="trash"
            testId="context-menu-rename"
            action={() => showRemoveDeviceModal({ device })}
            close={close}
        />
    );
};

export default RemoveButton;
