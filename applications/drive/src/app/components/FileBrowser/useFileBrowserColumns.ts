import { useActiveBreakpoint } from '@proton/components';
import { FileBrowserLayouts, ItemRowColumns } from '@proton/shared/lib/interfaces/drive/fileBrowser';

const COLUMNS_DESKTOP: Record<FileBrowserLayouts, ItemRowColumns[]> = {
    drive: ['modified', 'size', 'share_options'],
    trash: ['location', 'trashed', 'size'],
    sharing: ['location', 'share_created', 'share_num_access', 'share_expires'],
    search: ['location', 'uploaded', 'size', 'share_options'],
};

const COLUMNS_MOBILE: Record<FileBrowserLayouts, ItemRowColumns[]> = {
    drive: ['share_options'],
    trash: ['location', 'size'],
    sharing: ['location', 'share_expires'],
    search: ['location', 'size'],
};

export const useFileBrowserColumns = (fileBrowserType: FileBrowserLayouts) => {
    const { isDesktop } = useActiveBreakpoint();
    const columnsSource = isDesktop ? COLUMNS_DESKTOP : COLUMNS_MOBILE;

    return columnsSource[fileBrowserType];
};
