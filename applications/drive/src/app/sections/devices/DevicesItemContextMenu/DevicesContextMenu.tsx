import { c } from 'ttag';

import { useModalTwoStatic } from '@proton/components';
import { type Device, useDrive } from '@proton/drive';

import { type ContextMenuProps } from '../../../components/FileBrowser';
import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { RemoveDeviceModal } from '../../../modals/RemoveDeviceModal';
import { RenameDeviceModal } from '../../../modals/RenameDeviceModal';
import { getDeviceName } from '../getDeviceName';

const useGetDeviceByUid = (): ((uid: string) => Promise<Device | undefined>) => {
    const { drive } = useDrive();

    return async (uid: string) => {
        for await (const device of drive.iterateDevices()) {
            if (device.uid === uid) {
                return device;
            }
        }
    };
};

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
    const getDeviceByUid = useGetDeviceByUid();
    const [renameDeviceModal, showRenameDeviceModal] = useModalTwoStatic(RenameDeviceModal);
    const [removeDeviceModal, showRemoveDeviceModal] = useModalTwoStatic(RemoveDeviceModal);
    const isOnlyOneItem = selectedDevicesUid.length === 1;

    const onRename = async () => {
        const device = await getDeviceByUid(selectedDevicesUid[0]);
        if (device) {
            showRenameDeviceModal({
                deviceUid: device.uid,
                deviceName: getDeviceName(device),
            });
        }
    };

    const onRemove = async () => {
        const device = await getDeviceByUid(selectedDevicesUid[0]);
        if (device) {
            showRemoveDeviceModal({
                deviceUid: device.uid,
                deviceName: getDeviceName(device),
            });
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
