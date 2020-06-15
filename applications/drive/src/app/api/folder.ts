import { FOLDER_PAGE_SIZE, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from '../constants';
import { CreateNewFolder } from '../interfaces/folder';

export const queryFolderChildren = (
    shareID: string,
    linkID: string,
    {
        Page,
        PageSize = FOLDER_PAGE_SIZE,
        FoldersOnly = 0,
        SortField = DEFAULT_SORT_FIELD,
        SortOrder = DEFAULT_SORT_ORDER
    }: { Page: number; PageSize?: number; FoldersOnly?: number; SortField?: string; SortOrder?: string }
) => ({
    method: 'get',
    url: `drive/shares/${shareID}/folders/${linkID}/children`,
    params: { Page, PageSize, FoldersOnly, SortField, SortOrder }
});

export const queryCreateFolder = (shareID: string, data: CreateNewFolder) => ({
    method: 'post',
    url: `drive/shares/${shareID}/folders`,
    data
});
