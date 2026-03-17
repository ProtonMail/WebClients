import { Toolbar } from '@proton/components';

import { LayoutButton } from '../../../components/sections/ToolbarButtons';
import { useSelectionStore } from '../../../modules/selection';
import { RemoveButton } from '../statelessComponents/RemoveButton';
import { RenameButton } from '../statelessComponents/RenameButton';
import { useDevicesStore } from '../useDevices.store';

interface Props {
    onRename: (deviceUid: string) => void;
    onRemove: (deviceUid: string) => void;
}

export const DevicesToolbar = ({ onRename, onRemove }: Props) => {
    const selectedItemIds = useSelectionStore((state) => Array.from(state.selectedItemIds));
    const selectedItems = selectedItemIds
        .map((id) => useDevicesStore.getState().items.get(id))
        .filter((item) => item !== undefined);

    const selectedItem = selectedItems[0];

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            {selectedItem && (
                <div className="gap-2 flex">
                    <RenameButton buttonType="toolbar" onClick={() => onRename(selectedItem.uid)} />
                    <RemoveButton buttonType="toolbar" onClick={() => onRemove(selectedItem.uid)} />
                </div>
            )}
            <span className="ml-auto flex flex-nowrap">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};
