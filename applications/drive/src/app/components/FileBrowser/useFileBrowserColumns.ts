import { useActiveBreakpoint } from 'react-components';
import { FileBrowserLayouts, ItemRowColumns } from './interfaces';

const COLUMNS_DESKTOP: Record<FileBrowserLayouts, ItemRowColumns[]> = {
    drive: ['type', 'modified', 'size'],
    trash: ['location', 'type', 'trashed', 'size'],
    sharing: ['location', 'share_created', 'share_num_access', 'share_expires'],
};

const COLUMNS_MOBILE: Record<FileBrowserLayouts, ItemRowColumns[]> = {
    drive: ['type', 'size'],
    trash: ['location', 'type', 'size'],
    sharing: ['location', 'share_expires'],
};

export const useFileBrowserColumns = (fileBrowserType: FileBrowserLayouts) => {
    const { isDesktop } = useActiveBreakpoint();
    const columnsSource = isDesktop ? COLUMNS_DESKTOP : COLUMNS_MOBILE;

    return columnsSource[fileBrowserType];
};
