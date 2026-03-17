import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import type { ContextMenuPosition } from '../../../modules/contextMenu';
import { RemoveButton } from '../statelessComponents/RemoveButton';
import { RenameButton } from '../statelessComponents/RenameButton';

interface Props {
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    position: ContextMenuPosition | undefined;
    open: () => void;
    close: () => void;
    selectedDevicesUid: string[];
    onRename: (deviceUid: string) => void;
    onRemove: (deviceUid: string) => void;
}

export function DevicesItemContextMenu({
    selectedDevicesUid,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    onRename,
    onRemove,
}: Props) {
    const isOnlyOneItem = selectedDevicesUid.length === 1;

    if (!isOnlyOneItem) {
        return null;
    }

    const deviceUid = selectedDevicesUid[0];

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            <RenameButton buttonType="contextMenu" onClick={() => onRename(deviceUid)} close={close} />
            <RemoveButton buttonType="contextMenu" onClick={() => onRemove(deviceUid)} close={close} />
        </ItemContextMenu>
    );
}
