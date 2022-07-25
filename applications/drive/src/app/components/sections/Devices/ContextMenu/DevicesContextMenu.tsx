import { Device } from '../../../../store';
import { ContextMenuProps } from '../../../FileBrowser/interface';
import { ItemContextMenu } from '../../ContextMenu/ItemContextMenu';
import { RemoveButton, RenameButton } from './buttons';

export function DevicesItemContextMenu({
    selectedDevices,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedDevices: Device[];
}) {
    const isOnlyOneItem = selectedDevices.length === 1;

    if (!isOnlyOneItem) {
        return null;
    }

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            <RenameButton selectedDevices={selectedDevices} close={close} />
            <RemoveButton selectedDevices={selectedDevices} close={close} />
        </ItemContextMenu>
    );
}
