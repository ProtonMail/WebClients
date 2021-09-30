import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

export function noSelection(selectedItems: FileBrowserItem[]): boolean {
    return selectedItems.length === 0;
}

export function isMultiSelect(selectedItems: FileBrowserItem[]): boolean {
    return selectedItems.length > 1;
}

export function hasFoldersSelected(selectedItems: FileBrowserItem[]): boolean {
    return selectedItems.some((item) => item.Type === LinkType.FOLDER);
}
