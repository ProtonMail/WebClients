import { FileBrowserLayouts, ItemRowColumns } from './interfaces';

export const fileBrowserColumns: { [key in FileBrowserLayouts]: ItemRowColumns[] } = {
    drive: ['type', 'modified', 'size'],
    trash: ['location', 'type', 'modified', 'size'],
    sharing: ['location', 'share_created', 'share_num_access', 'share_expires'],
};
