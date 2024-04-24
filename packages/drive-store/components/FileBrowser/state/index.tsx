import { FileBrowserItemContextMenuProvider } from './useItemContextMenu';
import { SelectionProvider } from './useSelection';

export const FileBrowserStateProvider = ({ itemIds, children }: { children: React.ReactNode; itemIds: string[] }) => {
    return (
        <SelectionProvider itemIds={itemIds}>
            <FileBrowserItemContextMenuProvider>{children}</FileBrowserItemContextMenuProvider>
        </SelectionProvider>
    );
};
