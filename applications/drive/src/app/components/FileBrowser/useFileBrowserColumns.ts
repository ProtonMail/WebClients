import { useActiveBreakpoint } from '@proton/components';
import { FileBrowserLayouts, ItemRowColumns } from '@proton/shared/lib/interfaces/drive/fileBrowser';

const COLUMNS_DESKTOP: Record<FileBrowserLayouts, ItemRowColumns[]> = {      
    drive: ['uploaded', 'modified', 'size', 'share_options'],
    trash: ['location', 'trashed', 'size'],
    sharing: ['location', 'share_created', 'share_num_access', 'share_expires'],
};

const COLUMNS_MOBILE: Record<FileBrowserLayouts, ItemRowColumns[]> = {
    drive: ['size'],
    trash: ['location', 'size'],
    sharing: ['location', 'share_expires'],
};

export const useFileBrowserColumns = (fileBrowserType: FileBrowserLayouts) => {
    const { isDesktop } = useActiveBreakpoint();
    const columnsSource = isDesktop ? COLUMNS_DESKTOP : COLUMNS_MOBILE;

    return columnsSource[fileBrowserType];
};
