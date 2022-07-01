export function noSelection(selectedItems: any[]): boolean {
    return selectedItems.length === 0;
}

export function isMultiSelect(selectedItems: any[]): boolean {
    return selectedItems.length > 1;
}

export function hasFoldersSelected(selectedItems: { isFile: boolean }[]): boolean {
    return selectedItems.some((item) => !item.isFile);
}
