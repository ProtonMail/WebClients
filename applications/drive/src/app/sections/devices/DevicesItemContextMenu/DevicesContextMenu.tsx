import { c } from 'ttag';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { useRemoveDeviceModal } from '../../../modals/RemoveDeviceModal';
import { useRenameDeviceModal } from '../../../modals/RenameDeviceModal';
import { getDeviceByUid } from '../../../utils/sdk/getDeviceByUid';

export function DevicesItemContextMenu({
    selectedDevicesUid,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedDevicesUid: string[];
}) {
    const { renameDeviceModal, showRenameDeviceModal } = useRenameDeviceModal();
    const { removeDeviceModal, showRemoveDeviceModal } = useRemoveDeviceModal();
    const isOnlyOneItem = selectedDevicesUid.length === 1;

    const onRename = async () => {
        const device = await getDeviceByUid(selectedDevicesUid[0]);
        if (device) {
            showRenameDeviceModal({ deviceUid: device.uid });
        }
    };

    const onRemove = async () => {
        const device = await getDeviceByUid(selectedDevicesUid[0]);
        if (device) {
            showRemoveDeviceModal({ deviceUid: device.uid });
        }
    };

    if (!isOnlyOneItem) {
        return null;
    }

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                <ContextMenuButton
                    name={c('Action').t`Rename`}
                    icon="pen-square"
                    testId="context-menu-rename"
                    action={onRename}
                    close={close}
                />
                <ContextMenuButton
                    name={c('Action').t`Remove`}
                    icon="trash"
                    testId="context-menu-remove"
                    action={onRemove}
                    close={close}
                />
            </ItemContextMenu>
            {renameDeviceModal}
            {removeDeviceModal}
        </>
    );
}
