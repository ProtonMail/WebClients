import type { Device } from '../../../../store';
import type { ContextMenuProps } from '../../../FileBrowser/interface';
import { useRemoveDeviceModal } from '../../../modals/RemoveDeviceModal/RemoveDeviceModal';
import { useRenameDeviceModal } from '../../../modals/RenameDeviceModal/RenameDeviceModal';
import { ItemContextMenu } from '../../ContextMenu/ItemContextMenu';
import { DeviceRemoveButton, DeviceRenameButton } from './buttons';

export function DevicesItemContextMenuDeprecated({
    selectedDevices,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedDevices: Device[];
}) {
    const [renameDeviceModal, showRenameDeviceModal] = useRenameDeviceModal();
    const [removeDeviceModal, showRemoveDeviceModal] = useRemoveDeviceModal();
    const isOnlyOneItem = selectedDevices.length === 1;

    if (!isOnlyOneItem) {
        return null;
    }

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <DeviceRenameButton
                    showRenameDeviceModal={showRenameDeviceModal}
                    device={selectedDevices[0]}
                    close={close}
                />
                <DeviceRemoveButton
                    showRemoveDeviceModal={showRemoveDeviceModal}
                    device={selectedDevices[0]}
                    close={close}
                />
            </ItemContextMenu>
            {renameDeviceModal}
            {removeDeviceModal}
        </>
    );
}
